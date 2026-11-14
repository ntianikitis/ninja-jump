import * as Phaser from 'phaser'
import { PALETTE } from './palette'

export const TEX = {
  sky: 'px-sky',
  dirt: 'px-dirt',
  grass: 'px-grass',
  clouds: ['px-cloud-0', 'px-cloud-1', 'px-cloud-2'],
} as const

/** Hauteur (pixels d'art) des brins d'herbe au-dessus de la ligne du sol. */
export const GRASS_BLADES_HEIGHT = 5

const TILE = 16
const SKY_HEIGHT = 270

type Ctx = CanvasRenderingContext2D

/** Génère toutes les textures pixel art du décor (à appeler une fois, dans BootScene). */
export function createPixelTextures(scene: Phaser.Scene) {
  draw(scene, TEX.sky, 2, SKY_HEIGHT, drawSky)
  draw(scene, TEX.dirt, TILE, TILE, drawDirt)
  draw(scene, TEX.grass, TILE, GRASS_BLADES_HEIGHT + 7, drawGrass)

  // Bosses (centre x, rayon) : la plus haute au milieu pour un nuage bombé.
  const cloudShapes: [number, number][][] = [
    [[7, 5], [14, 8], [22, 10], [30, 7], [36, 5]],
    [[6, 4], [12, 7], [19, 5]],
    [[7, 5], [15, 9], [25, 12], [35, 9], [44, 6], [50, 4]],
  ]
  cloudShapes.forEach((bumps, i) => {
    const width = Math.max(...bumps.map(([x, r]) => x + r)) + 2
    const height = Math.ceil(Math.max(...bumps.map(([, r]) => r * 1.5))) + 3
    draw(scene, TEX.clouds[i], width, height, (ctx) => drawCloud(ctx, width, height, bumps))
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

/** Générateur pseudo-aléatoire à graine fixe : le décor est identique à chaque partie. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Dégradé en bandes, avec une ligne tramée entre deux bandes. */
function drawSky(ctx: Ctx) {
  const bands = PALETTE.sky
  const bandHeight = SKY_HEIGHT / bands.length
  for (let y = 0; y < SKY_HEIGHT; y++) {
    const band = Math.min(bands.length - 1, Math.floor(y / bandHeight))
    const isEdge = band < bands.length - 1 && y === Math.floor((band + 1) * bandHeight) - 1
    for (let x = 0; x < 2; x++) {
      px(ctx, x, y, isEdge && (x + y) % 2 === 0 ? bands[band + 1] : bands[band])
    }
  }
}

/** Terre en briques irrégulières, raccordable dans les deux directions. */
function drawDirt(ctx: Ctx) {
  const rand = rng(7)
  ctx.fillStyle = PALETTE.dirt
  ctx.fillRect(0, 0, TILE, TILE)

  const rowHeight = 4
  for (let row = 0; row < TILE / rowHeight; row++) {
    const y0 = row * rowHeight
    const offset = row % 2 === 0 ? 0 : 5
    // Joint horizontal en bas de chaque rangée.
    for (let x = 0; x < TILE; x++) px(ctx, x, y0 + rowHeight - 1, PALETTE.dirtDark)
    // Deux briques par rangée, de largeurs différentes.
    for (const start of [offset, offset + 9]) {
      const x0 = start % TILE
      px(ctx, x0, y0, PALETTE.dirtDark)
      px(ctx, x0, y0 + 1, PALETTE.dirtDark)
      px(ctx, x0, y0 + 2, PALETTE.dirtDark)
      // Reflet sur le haut de la brique.
      for (let i = 1; i < 4; i++) px(ctx, (x0 + i) % TILE, y0, PALETTE.dirtLight)
    }
  }

  // Petits points de texture.
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(rand() * TILE)
    const y = Math.floor(rand() * TILE)
    if (y % rowHeight !== rowHeight - 1) px(ctx, x, y, rand() < 0.5 ? PALETTE.dirtDark : PALETTE.dirtLight)
  }
}

/** Bande d'herbe : brins au-dessus de la ligne du sol, puis herbe pleine qui déborde sur la terre. */
function drawGrass(ctx: Ctx) {
  const rand = rng(3)
  const top = GRASS_BLADES_HEIGHT

  for (let x = 0; x < TILE; x++) {
    // Brins (décor, sans collision).
    if (rand() < 0.6) {
      const h = 1 + Math.floor(rand() * GRASS_BLADES_HEIGHT)
      for (let i = 1; i <= h; i++) px(ctx, x, top - i, i === h ? PALETTE.grassLight : PALETTE.grass)
    }
    // Herbe pleine.
    px(ctx, x, top, PALETTE.grassLight)
    px(ctx, x, top + 1, PALETTE.grass)
    px(ctx, x, top + 2, PALETTE.grass)
    px(ctx, x, top + 3, PALETTE.grassDark)
    // Bord irrégulier qui coule sur la terre.
    const drip = Math.floor(rand() * 4)
    for (let i = 0; i < drip; i++) px(ctx, x, top + 4 + i, i === drip - 1 ? PALETTE.dirtDark : PALETTE.grassDark)
  }
}

/** Nuage fait de bosses (centre x, rayon), avec un dessous ombré. */
function drawCloud(ctx: Ctx, width: number, height: number, bumps: [number, number][]) {
  const base = height - 3
  const inside = (x: number, y: number) =>
    // Bosses centrées un peu au-dessus de la base, coupées à plat en bas.
    y <= base && bumps.some(([cx, r]) => (x - cx) ** 2 + (y - (base - r / 2)) ** 2 <= r * r)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!inside(x, y)) continue
      const bottom = !inside(x, y + 1)
      const nearBottom = !inside(x, y + 2) || !inside(x, y + 3)
      px(ctx, x, y, bottom ? PALETTE.cloudEdge : nearBottom ? PALETTE.cloudShade : PALETTE.cloud)
    }
  }
}
