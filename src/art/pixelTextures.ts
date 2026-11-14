import * as Phaser from 'phaser'
import { PALETTE } from './palette'

export const TEX = {
  heart: 'px-heart',
  heartBig: 'px-heart-big',
  barEmpty: 'px-bar-empty',
  barFlash: 'px-bar-flash',
  barRed: 'px-bar-red',
  star: 'px-star',
  ninjaHead: 'px-ninja-head',
} as const

type Ctx = CanvasRenderingContext2D

/** Génère les textures pixel art de l'interface et des objets (à appeler une fois, dans BootScene). */
export function createPixelTextures(scene: Phaser.Scene) {
  const heartColors = { o: PALETTE.hudOutline, l: PALETTE.heartLight, r: PALETTE.heart, d: PALETTE.heartDark }
  drawPattern(scene, TEX.heart, HEART, heartColors)
  drawPattern(scene, TEX.heartBig, HEART_BIG, heartColors)
  drawPattern(scene, TEX.star, STAR, { o: PALETTE.hudOutline, l: PALETTE.starLight, y: PALETTE.star, d: PALETTE.starDark })
  drawPattern(scene, TEX.ninjaHead, NINJA_HEAD, {
    o: PALETTE.hudOutline,
    h: PALETTE.hood,
    k: PALETTE.hoodDark,
    r: PALETTE.heart,
    s: PALETTE.skin,
    e: PALETTE.hudOutline,
  })
  createBarSegmentTexture(scene, TEX.barEmpty, PALETTE.barEmptyLight, PALETTE.barEmpty, PALETTE.barEmpty)
  createBarSegmentTexture(scene, TEX.barFlash, PALETTE.flash, PALETTE.flash, PALETTE.flash)
  createBarSegmentTexture(scene, TEX.barRed, PALETTE.heartLight, PALETTE.heart, PALETTE.heartDark)
}

/** Largeur d'un segment de barre (pixels d'art) ; les segments voisins partagent leur contour. */
export const BAR_SEGMENT_WIDTH = 9

/**
 * Segment de barre (contour sombre, coins coupés) : reflet en haut, couleur, ombre en bas.
 * Exportée pour créer d'autres barres (ex. énergie en bleu).
 */
export function createBarSegmentTexture(scene: Phaser.Scene, key: string, light: string, base: string, dark: string) {
  const w = BAR_SEGMENT_WIDTH
  const h = 7
  draw(scene, key, w, h, (ctx) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1)
        if (corner) continue
        const border = x === 0 || x === w - 1 || y === 0 || y === h - 1
        px(ctx, x, y, border ? PALETTE.hudOutline : y === 1 ? light : y === h - 2 ? dark : base)
      }
    }
  })
}

// Motifs : o = contour, l = reflet, r = couleur, d = ombre, . = transparent.
const HEART = [
  '.oo...oo.',
  'olro.orro',
  'olrrorrro',
  'orrrrrrdo',
  '.orrrrdo.',
  '..orrdo..',
  '...odo...',
  '....o....',
]
const HEART_BIG = [
  '..ooo...ooo..',
  '.ollro.orrro.',
  'olllrrorrrrro',
  'ollrrrrrrrrro',
  'orrrrrrrrrrdo',
  'orrrrrrrrrrdo',
  '.orrrrrrrrdo.',
  '..orrrrrrdo..',
  '...orrrrdo...',
  '....orrdo....',
  '.....odo.....',
  '......o......',
]

const STAR = [
  '....o....',
  '...oyo...',
  'oooolyooo',
  'oyyyllyyo',
  '.oyyyyyo.',
  '..oyyyo..',
  '.oyydyyo.',
  '.oydodyo.',
  '.oo...oo.',
]
// Tête de ninja : h = cagoule, k = ombre, r = bandeau, s = peau, e = yeux.
const NINJA_HEAD = [
  '.oooooo.',
  'ohhhhhko',
  'orrrrrro',
  'ohesseko',
  'ohssssko',
  'ohhhhhko',
  'okkkkkko',
  '.oooooo.',
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

