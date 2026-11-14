import * as Phaser from 'phaser'
import { PALETTE } from './palette'

// Seule texture encore dessinée en code : le pack n'a pas de ninja.
export const TEX = {
  ninjaHead: 'px-ninja-head',
} as const

type Ctx = CanvasRenderingContext2D

/** Génère les textures pixel art maison (à appeler une fois, dans BootScene). */
export function createPixelTextures(scene: Phaser.Scene) {
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
