"""
Nettoie une planche de personnage pixel art générée par IA (JPEG, fond en damier, titres).

Étapes : détection des cases par rangée, suppression du fond et des textes, estimation de la taille
réelle d'un « pixel » du dessin, réduction au plus proche voisin, palette réduite, recadrage et
alignement sur une ligne de pieds commune, export d'une bande PNG + d'un GIF d'aperçu par animation.

Utilisation (depuis la racine du projet) :
    tools/.venv/bin/python tools/clean_spritesheet.py
    tools/.venv/bin/python tools/clean_spritesheet.py --pixel 3.6 --out assets-source/ninja-clean-petit
    tools/.venv/bin/python tools/clean_spritesheet.py --game public/assets/player   # fichiers du joueur pour le jeu
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

SOURCE = Path('assets-source/reference/character-exemple.jpeg')
OUTPUT = Path('assets-source/ninja-clean')

# Rangées de la planche, de haut en bas. Une rangée peut contenir plusieurs animations :
# (nom, nombre de cases) dans l'ordre de gauche à droite ; None = animation ignorée.
ROWS: list[list[tuple[str | None, int]]] = [
    [('idle', 6)],
    [(None, 7)],  # walk
    [('run', 7)],
    [('jump', 7)],
    [(None, 5)],  # crouch
    [('shuriken-throw', 5)],  # la case vide (projectile seul) est retirée automatiquement
    [(None, 7)],  # sword
    [(None, 3), ('damage', 4)],  # block, puis damage sur la même ligne
    [('death', 6)],
    [(None, 6)],  # special moves
    [('item-interaction', 4)],
]

# Durée d'une image dans les GIF d'aperçu (ms).
PREVIEW_MS = {'idle': 160, 'run': 90, 'jump': 110, 'shuriken-throw': 100, 'damage': 120, 'death': 140, 'item-interaction': 160}
PREVIEW_SCALE = 6
PREVIEW_BG = (223, 246, 245)  # ciel du jeu

# Seuils de détection : un pixel est « dessin » s'il est saturé (rouge, peau, bois) ou très sombre (contour).
MIN_SATURATION = 35
MAX_DARK_LUMA = 55
# Une case dont la surface dessinée est sous cette fraction de la médiane de sa rangée est vide (ex. projectile seul).
EMPTY_FRAME_RATIO = 0.3


@dataclass
class Frame:
    anim: str
    box: tuple[int, int, int, int]  # x0, y0, x1, y1 dans la planche (x1, y1 exclus)
    small: np.ndarray | None = None  # RGBA réduit, une valeur par pixel du dessin


@dataclass
class Report:
    pixel_size: float = 0
    frame_size: tuple[int, int] = (0, 0)
    feet_y: int = 0
    animations: dict[str, int] = field(default_factory=dict)
    dropped: list[str] = field(default_factory=list)
    palette: list[str] = field(default_factory=list)


def drawing_mask(rgb: np.ndarray) -> np.ndarray:
    """Vrai pour les pixels du dessin ; faux pour le damier gris et les textes blancs."""
    sat = rgb.max(2) - rgb.min(2)
    luma = rgb @ np.array([0.299, 0.587, 0.114])
    return (sat >= MIN_SATURATION) | (luma < MAX_DARK_LUMA)


def runs(profile: np.ndarray, min_gap: int) -> list[tuple[int, int]]:
    """Plages [début, fin) où le profil est non nul, en fusionnant les trous plus petits que min_gap."""
    on = np.flatnonzero(profile > 0)
    if len(on) == 0:
        return []
    result = [[on[0], on[0] + 1]]
    for i in on[1:]:
        if i - result[-1][1] < min_gap:
            result[-1][1] = i + 1
        else:
            result.append([i, i + 1])
    return [(a, b) for a, b in result]


def components(mask: np.ndarray) -> list[np.ndarray]:
    """Taches de pixels qui se touchent (8 voisins) ; renvoie, pour chacune, ses coordonnées (y, x)."""
    labels = np.zeros(mask.shape, dtype=np.int32)
    found = []
    h, w = mask.shape
    for sy, sx in zip(*np.nonzero(mask)):
        if labels[sy, sx]:
            continue
        label = len(found) + 1
        labels[sy, sx] = label
        stack, pixels = [(sy, sx)], []
        while stack:
            y, x = stack.pop()
            pixels.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = label
                        stack.append((ny, nx))
        found.append(np.array(pixels))
    return found


def split_band(band: np.ndarray, y0: int, report: Report, attach_distance: int = 8) -> list[tuple[int, int, int, int]]:
    """Découpe une rangée en cases : une grosse tache = un personnage ; les petites taches proches
    (traînée, objet tenu) lui sont rattachées ; les petites taches isolées (projectile seul) sont écartées."""
    blobs = components(band)
    sizes = np.array([len(b) for b in blobs])
    big = [b for b in blobs if len(b) >= EMPTY_FRAME_RATIO * np.median(sizes[sizes >= sizes.max() * 0.2])]
    boxes = [[b[:, 1].min(), b[:, 0].min(), b[:, 1].max() + 1, b[:, 0].max() + 1] for b in big]

    for blob in blobs:
        if any(blob is b for b in big) or len(blob) < 4:
            continue
        bx0, by0, bx1, by1 = blob[:, 1].min(), blob[:, 0].min(), blob[:, 1].max() + 1, blob[:, 0].max() + 1
        # Distance entre boîtes (0 si elles se chevauchent).
        distances = [max(0, max(b[0] - bx1, bx0 - b[2])) + max(0, max(b[1] - by1, by0 - b[3])) for b in boxes]
        nearest = int(np.argmin(distances))
        if distances[nearest] <= attach_distance:
            b = boxes[nearest]
            boxes[nearest] = [min(b[0], bx0), min(b[1], by0), max(b[2], bx1), max(b[3], by1)]
        else:
            report.dropped.append(f'rangée y={y0} : tache isolée x={bx0}-{bx1} ({len(blob)} px), écartée')
    return [tuple(int(v) for v in b) for b in sorted(boxes, key=lambda b: b[0])]


def find_frames(mask: np.ndarray, report: Report) -> list[Frame]:
    # Rangées : bandes horizontales de dessin (les titres, blancs, ne sont pas dans le masque).
    bands = [b for b in runs((mask.sum(1) > 2).astype(int), min_gap=8) if b[1] - b[0] > 20]
    if len(bands) != len(ROWS):
        raise SystemExit(f'{len(bands)} rangées détectées, {len(ROWS)} attendues : vérifier ROWS ou les seuils')

    frames: list[Frame] = []
    for (y0, y1), layout in zip(bands, ROWS):
        cells = [(x0, y0 + top, x1, y0 + bottom) for x0, top, x1, bottom in split_band(mask[y0:y1], y0, report)]

        if all(name is None for name, _ in layout):
            continue  # rangée ignorée : inutile de vérifier ses cases
        expected = sum(n for _, n in layout)
        if len(cells) != expected:
            raise SystemExit(f'Rangée y={y0} : {len(cells)} cases détectées, {expected} attendues')
        i = 0
        for name, count in layout:
            if name:
                frames += [Frame(name, box) for box in cells[i:i + count]]
            i += count
    return frames


def edge_profiles(rgb: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Force des changements de couleur entre colonnes voisines et entre lignes voisines (dans le dessin)."""
    dx = np.abs(np.diff(rgb, axis=1)).sum(2) * (mask[:, 1:] | mask[:, :-1])
    dy = np.abs(np.diff(rgb, axis=0)).sum(2) * (mask[1:] | mask[:-1])
    return dx.sum(0), dy.sum(1)


def grid_score(profile: np.ndarray, period: float) -> tuple[float, float]:
    """Concentration des contours sur une grille de pas `period` ; renvoie (score, décalage)."""
    positions = np.arange(len(profile)) + 0.5  # un contour est entre deux pixels
    angles = 2 * np.pi * positions / period
    vector = (profile * np.exp(1j * angles)).sum()
    score = abs(vector) / (profile.sum() + 1e-9)
    offset = (np.angle(vector) / (2 * np.pi) * period) % period
    return score, offset


def estimate_pixel_size(rgb: np.ndarray, mask: np.ndarray, frames: list[Frame]) -> float:
    candidates = np.arange(2.0, 8.0, 0.01)
    total = np.zeros_like(candidates)
    for f in frames:
        x0, y0, x1, y1 = f.box
        px, py = edge_profiles(rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1])
        for i, p in enumerate(candidates):
            total[i] += grid_score(px, p)[0] + grid_score(py, p)[0]
    # Les multiples du vrai pas scorent aussi : on prend le plus petit pas proche du meilleur score.
    best = total.max()
    return float(candidates[np.flatnonzero(total >= 0.92 * best)[0]])


def downsample(rgb: np.ndarray, mask: np.ndarray, frame: Frame, pixel: float, margin: int = 2) -> np.ndarray:
    """Réduit une case au plus proche voisin, en échantillonnant le centre de chaque « pixel » du dessin."""
    x0, y0, x1, y1 = frame.box
    x0, y0 = max(0, x0 - margin), max(0, y0 - margin)
    x1, y1 = min(rgb.shape[1], x1 + margin), min(rgb.shape[0], y1 + margin)
    crop, cmask = rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1]
    px, py = edge_profiles(crop, cmask)
    ox, oy = grid_score(px, pixel)[1], grid_score(py, pixel)[1]

    cols = int((crop.shape[1] - ox) // pixel)
    rows = int((crop.shape[0] - oy) // pixel)
    out = np.zeros((rows, cols, 4), dtype=np.uint8)
    inner = max(1, int(pixel * 0.25))  # on évite les bords de chaque cellule (flou JPEG)
    for j in range(rows):
        for i in range(cols):
            cx0 = int(round(ox + i * pixel)) + inner
            cy0 = int(round(oy + j * pixel)) + inner
            cx1 = max(cx0 + 1, int(round(ox + (i + 1) * pixel)) - inner)
            cy1 = max(cy0 + 1, int(round(oy + (j + 1) * pixel)) - inner)
            cell_mask = cmask[cy0:cy1, cx0:cx1]
            if cell_mask.size == 0 or cell_mask.mean() < 0.5:
                continue
            colors = crop[cy0:cy1, cx0:cx1][cell_mask]
            out[j, i, :3] = np.median(colors, axis=0)
            out[j, i, 3] = 255
    return out


def reduce_palette(frames: list[Frame], colors: int, report: Report) -> None:
    """Palette commune à toutes les animations (élimine les nuances dues à la compression JPEG)."""
    pixels = np.concatenate([f.small[f.small[..., 3] > 0][:, :3] for f in frames])
    sample = Image.fromarray(pixels.reshape(1, -1, 3).astype(np.uint8))
    palette_img = sample.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    palette = np.array(palette_img.getpalette()[: colors * 3]).reshape(-1, 3)
    report.palette = ['#%02x%02x%02x' % tuple(c) for c in palette]
    for f in frames:
        opaque = f.small[..., 3] > 0
        rgb = f.small[opaque][:, :3].astype(int)
        nearest = ((rgb[:, None, :] - palette[None, :, :]) ** 2).sum(2).argmin(1)
        f.small[opaque, :3] = palette[nearest]


def clean_islands(f: Frame, min_size: int = 3) -> None:
    """Retire les petits îlots isolés (restes de fond ou de texte)."""
    alpha = f.small[..., 3] > 0
    seen = np.zeros_like(alpha)
    h, w = alpha.shape
    for y in range(h):
        for x in range(w):
            if not alpha[y, x] or seen[y, x]:
                continue
            stack, island = [(y, x)], []
            seen[y, x] = True
            while stack:
                cy, cx = stack.pop()
                island.append((cy, cx))
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(island) < min_size:
                for cy, cx in island:
                    f.small[cy, cx] = 0


def align(frames: list[Frame], report: Report) -> dict[str, list[Image.Image]]:
    """Recadre et place toutes les cases dans une taille commune, pieds sur la même ligne.
    Repère horizontal : le centre de la tête (haut du dessin), plus stable que la boîte entière."""
    infos = []
    for f in frames:
        alpha = f.small[..., 3] > 0
        ys, xs = np.nonzero(alpha)
        top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        head = alpha[top: top + max(3, (bottom - top) * 2 // 5)]
        anchor = int(round(np.nonzero(head)[1].mean()))
        infos.append((f, top, bottom, left, right, anchor))

    # Tête au centre exact de l'image : le jeu retourne le sprite autour de ce centre (demi-tour)
    # et y centre la hitbox, donc le corps ne doit pas se décaler quand le ninja change de direction.
    extent = max(max(anchor - left, right - anchor) for _, _, _, left, right, anchor in infos)
    height = max(bottom - top for _, top, bottom, _, _, _ in infos)
    width = 2 * extent + 1
    report.frame_size = (int(width), int(height + 1))
    report.feet_y = int(height + 1)

    strips: dict[str, list[Image.Image]] = {}
    for f, top, bottom, left, right, anchor in infos:
        canvas = Image.new('RGBA', report.frame_size, (0, 0, 0, 0))
        sprite = Image.fromarray(f.small[top:bottom, left:right])
        canvas.paste(sprite, (int(extent - (anchor - left)), report.feet_y - (bottom - top)))
        strips.setdefault(f.anim, []).append(canvas)
    return strips


def export(strips: dict[str, list[Image.Image]], report: Report, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    w, h = report.frame_size
    overview_rows = []
    for name, images in strips.items():
        strip = Image.new('RGBA', (w * len(images), h), (0, 0, 0, 0))
        for i, img in enumerate(images):
            strip.paste(img, (i * w, 0))
        strip.save(output / f'{name}.png')
        report.animations[name] = len(images)

        # GIF d'aperçu : agrandi, sur fond ciel, ligne des pieds en pointillés.
        preview = []
        for img in images:
            bg = Image.new('RGB', (w, h), PREVIEW_BG)
            bg.paste(img, (0, 0), img)
            big = bg.resize((w * PREVIEW_SCALE, h * PREVIEW_SCALE), Image.Resampling.NEAREST)
            draw = ImageDraw.Draw(big)
            for x in range(0, big.width, 8):
                draw.point((x, report.feet_y * PREVIEW_SCALE - 1), fill=(120, 140, 140))
            preview.append(big)
        preview[0].save(output / f'{name}.gif', save_all=True, append_images=preview[1:],
                        duration=PREVIEW_MS.get(name, 120), loop=0, disposal=2)
        overview_rows.append((name, strip))

    # Planche récapitulative (×4) pour vérifier d'un coup d'œil.
    scale = 4
    label_h = 14
    total_w = max(s.width for _, s in overview_rows) * scale + 8
    total_h = sum(s.height * scale + label_h + 6 for _, s in overview_rows)
    sheet = Image.new('RGB', (total_w, total_h), PREVIEW_BG)
    draw = ImageDraw.Draw(sheet)
    y = 0
    for name, strip in overview_rows:
        draw.text((4, y + 1), f'{name} ({report.animations[name]} images)', fill=(40, 40, 60))
        y += label_h
        big = strip.resize((strip.width * scale, strip.height * scale), Image.Resampling.NEAREST)
        sheet.paste(big, (4, y), big)
        for i in range(1, report.animations[name]):
            draw.line([(4 + i * w * scale, y), (4 + i * w * scale, y + h * scale)], fill=(180, 200, 200))
        y += h * scale + 6
    sheet.save(output / 'apercu.png')


# Export pour le jeu : nom de l'animation dans le jeu -> (animation de la planche, images retenues).
GAME_ANIMS = {
    'idle': ('idle', slice(None)),
    'run': ('run', slice(None)),
    'jump': ('jump', slice(1, 4)),  # montée (sans l'accroupi du décollage)
    'fall': ('jump', slice(4, 6)),  # descente (sans l'accroupi de l'atterrissage)
    'hurt': ('damage', slice(None)),
    'victory': ('item-interaction', slice(None)),
    'throw': ('shuriken-throw', slice(None)),  # facultative dans le jeu
    'death': ('death', slice(None)),  # facultative dans le jeu
}
# (images par seconde, répétition : -1 = en boucle, 0 = une fois)
GAME_RATES = {
    'idle': (8, -1), 'run': (12, -1), 'jump': (10, 0), 'fall': (6, -1),
    'hurt': (12, 0), 'victory': (8, -1), 'throw': (18, 0), 'death': (8, 0),
}
# Le jeu dessine le monde zoomé ×2 : à l'échelle 0.5, chaque pixel du dessin reste un pixel à l'écran.
GAME_SCALE = 0.5
GAME_COLUMNS = 8


def export_game(strips: dict[str, list[Image.Image]], report: Report, output: Path) -> None:
    """Écrit player.png, player.json (atlas JSON Hash de Phaser) et character.json (voir le README du dossier)."""
    output.mkdir(parents=True, exist_ok=True)
    w, h = report.frame_size
    frames = [(f'{game}/{i:02d}', img) for game, (source, part) in GAME_ANIMS.items()
              for i, img in enumerate(strips[source][part])]
    rows = -(-len(frames) // GAME_COLUMNS)
    sheet = Image.new('RGBA', (GAME_COLUMNS * w, rows * h), (0, 0, 0, 0))
    atlas_frames = {}
    for i, (name, img) in enumerate(frames):
        x, y = (i % GAME_COLUMNS) * w, (i // GAME_COLUMNS) * h
        sheet.paste(img, (x, y))
        atlas_frames[name] = {
            'frame': {'x': x, 'y': y, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h},
        }
    sheet.save(output / 'player.png')
    atlas = {'frames': atlas_frames, 'meta': {'image': 'player.png', 'size': {'w': sheet.width, 'h': sheet.height}, 'scale': 1}}
    (output / 'player.json').write_text(json.dumps(atlas, indent=2))

    # Hitbox d'après le corps en position de repos : un peu plus étroite que la silhouette (bras exclus).
    alpha = np.asarray(strips['idle'][0])[..., 3] > 0
    ys, xs = np.nonzero(alpha)
    body_w, body_h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    character = {
        'scale': GAME_SCALE,
        'hitbox': {'width': int(round(body_w * 0.55)), 'height': int(body_h - 2), 'bottom': report.feet_y},
        'animations': {name: {'frameRate': rate, 'repeat': repeat} for name, (rate, repeat) in GAME_RATES.items()},
    }
    (output / 'character.json').write_text(json.dumps(character, indent=2) + '\n')
    print(f'Jeu : {len(frames)} images dans {output}/player.png ({sheet.width}x{sheet.height}), hitbox {character["hitbox"]}')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--colors', type=int, default=16, help='taille de la palette (16 par défaut)')
    parser.add_argument('--pixel', type=float, help='forcer la taille d\'un pixel du dessin (sinon détectée)')
    parser.add_argument('--out', type=Path, default=OUTPUT, help=f'dossier de sortie ({OUTPUT} par défaut)')
    parser.add_argument('--game', type=Path, metavar='DOSSIER',
                        help='écrire aussi les fichiers du joueur pour le jeu (ex. public/assets/player)')
    args = parser.parse_args()

    rgb = np.asarray(Image.open(args.source).convert('RGB')).astype(np.int32)
    mask = drawing_mask(rgb)
    report = Report()

    frames = find_frames(mask, report)
    report.pixel_size = args.pixel or estimate_pixel_size(rgb, mask, frames)
    for f in frames:
        f.small = downsample(rgb, mask, f, report.pixel_size)
    reduce_palette(frames, args.colors, report)
    for f in frames:
        clean_islands(f)
    strips = align(frames, report)
    export(strips, report, args.out)
    if args.game:
        export_game(strips, report, args.game)

    (args.out / 'rapport.json').write_text(json.dumps(report.__dict__, indent=2, ensure_ascii=False))
    print(f'Pixel du dessin : {report.pixel_size:.2f} px de la planche')
    print(f'Taille de frame commune : {report.frame_size[0]}x{report.frame_size[1]} (pieds en y={report.feet_y})')
    for name, n in report.animations.items():
        print(f'  {name} : {n} images')
    for d in report.dropped:
        print(f'  ignoré : {d}')
    print(f'Fichiers dans {args.out}/ (apercu.png pour tout voir d\'un coup)')


if __name__ == '__main__':
    main()
