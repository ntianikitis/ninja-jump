import * as Phaser from 'phaser'
import { PALETTE } from './palette'

// Textures dessinées en code, au style du pack (qui n'a ni ninja, ni shuriken, ni coffre, ni fumée).
export const TEX = {
  ninjaHead: 'px-ninja-head',
  shuriken: 'px-shuriken',
  chest: ['px-chest-closed', 'px-chest-opening', 'px-chest-open'],
  poof: ['px-poof-0', 'px-poof-1', 'px-poof-2'],
} as const

export const PX_ANIMS = {
  chestOpen: 'chest-open',
  poof: 'poof',
} as const

type Ctx = CanvasRenderingContext2D

/** Génère les textures pixel art maison et leurs animations (à appeler une fois, dans BootScene). */
export function createPixelTextures(scene: Phaser.Scene) {
  drawPattern(scene, TEX.shuriken, SHURIKEN, { o: PALETTE.outline, w: PALETTE.metalLight, g: PALETTE.metal, d: PALETTE.shadow })
  TEX.chest.forEach((key, stage) => draw(scene, key, 18, 18, (ctx) => drawChest(ctx, stage)))
  TEX.poof.forEach((key, stage) => draw(scene, key, 16, 16, (ctx) => drawPoof(ctx, stage)))
  if (!scene.anims.exists(PX_ANIMS.chestOpen)) {
    scene.anims.create({ key: PX_ANIMS.chestOpen, frames: TEX.chest.map((key) => ({ key })), frameRate: 10 })
    scene.anims.create({ key: PX_ANIMS.poof, frames: TEX.poof.map((key) => ({ key })), frameRate: 14 })
  }

  drawPattern(scene, TEX.ninjaHead, NINJA_HEAD, {
    o: PALETTE.outline,
    h: PALETTE.hood,
    k: PALETTE.hoodDark,
    r: PALETTE.red,
    s: PALETTE.skin,
    e: PALETTE.outline,
  })
}

// Tête de ninja, au style du pack : o = contour, h = cagoule, k = ombre, r = bandeau, s = peau, e = yeux.
const NINJA_HEAD = [
  '...oooooo...',
  '..ohhhhhhko.',
  '.ohhhhhhhhko',
  'orrrrrrrrrro',
  'ohssssssssko',
  'ohseessseeko',
  'ohssssssssko',
  'ohhhhhhhhhko',
  '.ohhhhhhhko.',
  '..okkkkkkko.',
  '...oooooo...',
]

// Shuriken à 4 pointes : o = contour, w = reflet, g = métal, d = trou central.
const SHURIKEN = [
  '....o....',
  '...owo...',
  '...owo...',
  '.ooogooo.',
  'owwgdgggo',
  '.ooogooo.',
  '...ogo...',
  '...ogo...',
  '....o....',
]

/** Coffre 18x18 en bois et serrure dorée ; stage 0 = fermé, 1 = entrouvert, 2 = ouvert. */
function drawChest(ctx: Ctx, stage: number) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }
  // Caisse : contour, bois, ombre en bas, deux bandes sombres.
  rect(1, 9, 16, 9, PALETTE.woodOutline)
  rect(2, 10, 14, 7, PALETTE.wood)
  rect(2, 16, 14, 1, PALETTE.woodDark)
  rect(4, 10, 1, 7, PALETTE.woodDark)
  rect(13, 10, 1, 7, PALETTE.woodDark)

  if (stage === 0) {
    // Couvercle fermé + serrure.
    rect(1, 3, 16, 7, PALETTE.woodOutline)
    rect(2, 4, 14, 1, PALETTE.woodLight)
    rect(2, 5, 14, 4, PALETTE.wood)
    rect(7, 7, 4, 4, PALETTE.woodOutline)
    rect(8, 8, 2, 2, PALETTE.gold)
  } else {
    // Intérieur sombre (avec un éclat doré), couvercle relevé plus ou moins haut.
    const lidTop = stage === 1 ? 1 : 0
    const lidHeight = stage === 1 ? 5 : 3
    rect(1, 6, 16, 4, PALETTE.woodOutline)
    rect(2, 7, 14, 2, PALETTE.shadow)
    rect(6, 8, 2, 1, PALETTE.gold)
    rect(10, 8, 1, 1, PALETTE.coin)
    rect(1, lidTop, 16, lidHeight + 1, PALETTE.woodOutline)
    rect(2, lidTop + 1, 14, lidHeight - 1, PALETTE.woodLight)
  }
}

/** Petit nuage de fumée qui grossit et s'éclaircit (3 étapes). */
function drawPoof(ctx: Ctx, stage: number) {
  const puffs = [
    [[8, 9, 3]],
    [[5, 9, 3], [11, 9, 3], [8, 6, 3]],
    [[4, 10, 2], [12, 10, 2], [8, 4, 2], [3, 5, 1], [13, 5, 1]],
  ][stage]
  for (const [cx, cy, r] of puffs) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r + 1) continue
        px(ctx, cx + x, cy + y, y > r / 2 ? PALETTE.metal : PALETTE.metalLight)
      }
    }
  }
}

function drawPattern(scene: Phaser.Scene, key: string, rows: string[], colors: Record<string, string>) {
  draw(scene, key, rows[0].length, rows.length, (ctx) => {
    rows.forEach((row, y) => {
      ;[...row].forEach((char, x) => {
        if (colors[char]) px(ctx, x, y, colors[char])
      })
    })
  })
}

function draw(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void) {
  if (scene.textures.exists(key)) return
  const texture = scene.textures.createCanvas(key, w, h)!
  paint(texture.context)
  texture.refresh()
}

const px = (ctx: Ctx, x: number, y: number, color: string) => {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}
