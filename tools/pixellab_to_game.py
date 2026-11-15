"""
Assemble les animations du ninja PixelLab (assets-source/pixellab/ninja/) en fichiers du joueur pour le jeu.

Pour chaque animation : choix des images, recalage des pieds sur une ligne commune et de la tête au centre
de l'image (le jeu retourne le sprite autour de ce centre), puis export de player.png, player.json (atlas
JSON Hash de Phaser) et character.json, comme tools/clean_spritesheet.py.

Utilisation (depuis la racine du projet) :
    tools/.venv/bin/python tools/pixellab_to_game.py                      # écrit dans public/assets/player
    tools/.venv/bin/python tools/pixellab_to_game.py --game /tmp/essai    # ailleurs, pour comparer
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

SOURCE = Path('assets-source/pixellab/ninja/Idle/animations')
OUTPUT = Path('public/assets/player')
DIRECTION = 'east'  # images tournées vers la droite


@dataclass
class Clip:
    source: str  # dossier de l'animation PixelLab
    frames: slice  # images retenues
    # 'anim' : seule l'image la plus basse touche le sol (garde les petits bonds : idle, course, victoire) ;
    # 'frame' : chaque image est posée sur le sol (coup de pied qui remonte, saut dont le jeu gère la hauteur).
    ground: str
    # (x de séparation des jambes, y du genou) : la jambe avant (x >= séparation, y >= genou) est descendue
    # jusqu'au niveau du pied arrière, tibia allongé (PixelLab dessine le pied avant trop haut en garde).
    front_leg: tuple[int, int] | None = None


# Nom de l'animation dans le jeu -> images PixelLab retenues.
GAME_ANIMS = {
    'idle': Clip('idle-profil', slice(2, 8), 'anim', front_leg=(46, 60)),  # garde (sans la mise en garde)
    'run': Clip('full-sprint', slice(None), 'anim'),
    'jump': Clip('jump', slice(1, 4), 'frame'),  # montée (sans l'image debout)
    'fall': Clip('jump', slice(4, 6), 'frame'),  # descente (sans l'atterrissage)
    'hurt': Clip('hurt-2', slice(None), 'frame'),
    'victory': Clip('victory', slice(None), 'anim'),
    'throw': Clip('kick', slice(None), 'frame'),  # coup de pied joué au lancer de shuriken
    'death': Clip('death', slice(None), 'anim'),
}
# (images par seconde, répétition : -1 = en boucle, 0 = une fois)
GAME_RATES = {
    'idle': (10, -1), 'run': (12, -1), 'jump': (10, 0), 'fall': (6, -1),
    'hurt': (12, 0), 'victory': (10, -1), 'throw': (18, 0), 'death': (8, 0),
}
# Le jeu dessine le monde zoomé ×2 : à l'échelle 0.5, chaque pixel du dessin reste un pixel à l'écran.
GAME_SCALE = 0.5
GAME_COLUMNS = 8
PREVIEW_BG = (90, 150, 200)


def load(clip: Clip, source: Path) -> list[np.ndarray]:
    paths = sorted((source / clip.source / DIRECTION).glob('frame_*.png'))
    if not paths:
        raise SystemExit(f'Aucune image dans {source / clip.source / DIRECTION}')
    images = [np.asarray(Image.open(p).convert('RGBA')) for p in paths][clip.frames]
    return [lower_front_leg(img, *clip.front_leg) for img in images] if clip.front_leg else images


def lower_front_leg(img: np.ndarray, split: int, knee: int) -> np.ndarray:
    alpha = img[..., 3] > 0
    back = int(np.nonzero(alpha[:, :split].any(axis=1))[0].max())
    front = int(np.nonzero(alpha[knee:, split:].any(axis=1))[0].max()) + knee
    gap = back - front
    if gap <= 0:
        return img
    out = img.copy()
    leg = img[knee:, split:]
    out[knee:, split:] = 0
    out[knee + gap:, split:] = leg[:img.shape[0] - knee - gap]
    out[knee:knee + gap, split:] = leg[0]  # tibia allongé : la ligne du genou répétée
    return out


def bbox(img: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(img[..., 3] > 0)
    return int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1


def head_center(img: np.ndarray) -> float:
    """Centre horizontal de la tête (haut du dessin), plus stable que la boîte entière. Seules les colonnes
    épaisses comptent : les rubans du bandeau, fins, tireraient le centre vers l'arrière."""
    alpha = img[..., 3] > 0
    top, bottom, _, _ = bbox(img)
    head = alpha[top: top + max(3, (bottom - top) * 2 // 5)]
    thickness = head.sum(axis=0)
    columns = np.nonzero(thickness >= thickness.max() * 0.6)[0]
    return float((columns.min() + columns.max()) / 2)


def place(clips: dict[str, list[np.ndarray]]) -> tuple[dict[str, list[Image.Image]], tuple[int, int]]:
    """Décale chaque image (pieds sur y=0, tête de la 1re image de l'animation en x=0), puis les met toutes
    dans une taille commune, symétrique autour de la tête."""
    shifted: dict[str, list[tuple[np.ndarray, int, int]]] = {}
    for name, images in clips.items():
        mode = GAME_ANIMS[name].ground
        anchor = round(head_center(images[0]))
        anim_bottom = max(bbox(img)[1] for img in images)
        shifted[name] = [(img, anchor, bbox(img)[1] if mode == 'frame' else anim_bottom) for img in images]

    extent = max(max(anchor - bbox(img)[2], bbox(img)[3] - anchor)
                 for items in shifted.values() for img, anchor, _ in items)
    height = max(feet - bbox(img)[0] for items in shifted.values() for img, _, feet in items)
    size = (2 * extent + 1, height)

    strips: dict[str, list[Image.Image]] = {}
    for name, items in shifted.items():
        for img, anchor, feet in items:
            canvas = Image.new('RGBA', size, (0, 0, 0, 0))
            canvas.paste(Image.fromarray(img), (extent - anchor, height - feet))
            strips.setdefault(name, []).append(canvas)
    return strips, size


def export_game(strips: dict[str, list[Image.Image]], size: tuple[int, int], output: Path) -> None:
    """Écrit player.png, player.json et character.json (voir le README de public/assets/player)."""
    output.mkdir(parents=True, exist_ok=True)
    w, h = size
    frames = [(f'{name}/{i:02d}', img) for name, images in strips.items() for i, img in enumerate(images)]
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

    # Hitbox d'après le corps en garde : plus étroite que la silhouette (poings et jambes écartées exclus).
    top, bottom, left, right = bbox(np.asarray(strips['idle'][0]))
    character = {
        'scale': GAME_SCALE,
        'hitbox': {'width': int(round((right - left) * 0.55)), 'height': int(bottom - top - 2), 'bottom': h},
        'animations': {name: {'frameRate': rate, 'repeat': repeat} for name, (rate, repeat) in GAME_RATES.items()},
    }
    (output / 'character.json').write_text(json.dumps(character, indent=2) + '\n')
    print(f'Jeu : {len(frames)} images {w}x{h} dans {output}/player.png ({sheet.width}x{sheet.height}), '
          f'hitbox {character["hitbox"]}')


def preview(strips: dict[str, list[Image.Image]], size: tuple[int, int], path: Path, scale: int = 3) -> None:
    """Planche d'aperçu : une rangée par animation, ligne des pieds et centre de l'image tracés."""
    w, h = size
    label_h = 14
    sheet = Image.new('RGB', (GAME_COLUMNS * w * scale + 8, len(strips) * (h * scale + label_h + 6)), PREVIEW_BG)
    draw = ImageDraw.Draw(sheet)
    y = 0
    for name, images in strips.items():
        draw.text((4, y + 1), f'{name} ({len(images)} images)', fill=(40, 40, 60))
        y += label_h
        for i, img in enumerate(images):
            x = 4 + i * w * scale
            sheet.paste(img.resize((w * scale, h * scale), Image.Resampling.NEAREST), (x, y),
                        img.resize((w * scale, h * scale), Image.Resampling.NEAREST))
            draw.line([(x + w * scale // 2, y), (x + w * scale // 2, y + h * scale)], fill=(120, 170, 215))
        draw.line([(4, y + h * scale - 1), (sheet.width - 4, y + h * scale - 1)], fill=(60, 110, 60))
        y += h * scale + 6
    sheet.save(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--game', type=Path, default=OUTPUT, help=f'dossier des fichiers du joueur ({OUTPUT} par défaut)')
    parser.add_argument('--preview', type=Path, default=Path('assets-source/pixellab/apercu-jeu.png'))
    args = parser.parse_args()

    clips = {name: load(clip, args.source) for name, clip in GAME_ANIMS.items()}
    strips, size = place(clips)
    export_game(strips, size, args.game)
    preview(strips, size, args.preview)
    print(f'Aperçu : {args.preview}')


if __name__ == '__main__':
    main()
