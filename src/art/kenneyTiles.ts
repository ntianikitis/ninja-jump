// Pack Kenney « Pixel Platformer » (CC0), planches copiées dans public/assets/kenney/.
import type * as Phaser from 'phaser'

export const KENNEY = {
  tiles: 'kenney-tiles',
  characters: 'kenney-characters',
} as const

/** Taille d'une tuile de tiles.png (px). */
export const TILE_SIZE = 18
/** Taille d'un personnage de characters.png (px). */
export const CHAR_SIZE = 24

// Numéro d'une tuile de tiles.png = ligne × 20 + colonne.
export const TILES = {
  // Terrain herbe, en variantes colonne seule / bord gauche / milieu / bord droit.
  // Dalle d'une seule tuile de haut (contour en bas).
  slabSingle: 0,
  slabLeft: 1,
  slabMid: 2,
  slabRight: 3,
  // Dessus d'herbe avec de la terre en dessous.
  grassSingle: 20,
  grassLeft: 21,
  grassMid: 22,
  grassRight: 23,
  // Terre (intérieur), et dernière rangée avec contour en bas.
  dirtSingle: 120,
  dirtLeft: 121,
  dirtMid: 122,
  dirtRight: 123,
  dirtBottomSingle: 140,
  dirtBottomLeft: 141,
  dirtBottomMid: 142,
  dirtBottomRight: 143,
  // Objets et interface.
  heartFull: 44,
  heartHalf: 45,
  heartEmpty: 46,
  coin: 151,
  coinTurned: 152,
  leverOff: 64,
  leverOn: 66,
  flag: 111,
  flagWaving: 112,
  flagPole: 131,
  // Planche (plateforme mobile, répétée sur sa largeur), ressort, pics.
  plank: 146,
  springDown: 107,
  springUp: 108,
  spikes: 68,
  // Police du pack : « x » et chiffres 0 à 9 (160 + chiffre).
  times: 158,
  digit0: 160,
} as const

// Numéro d'un personnage de characters.png = ligne × 9 + colonne.
export const CHARS = {
  // Bestiole à casque à pointes (2 images de marche).
  spikyWalk1: 15,
  spikyWalk2: 16,
  // Chauve-souris : ailes hautes, à plat, basses.
  batUp: 24,
  batMid: 25,
  batDown: 26,
} as const

export const ANIMS = {
  enemyWalk: 'enemy-walk',
  coinSpin: 'coin-spin',
  flagWave: 'flag-wave',
  flyerFlap: 'flyer-flap',
} as const

/** Animations des éléments du pack (à créer une fois, dans BootScene). */
export function createKenneyAnimations(scene: Phaser.Scene) {
  const frames = (key: string, ...ids: number[]) => ids.map((frame) => ({ key, frame }))
  scene.anims.create({ key: ANIMS.enemyWalk, frames: frames(KENNEY.characters, CHARS.spikyWalk1, CHARS.spikyWalk2), frameRate: 6, repeat: -1 })
  scene.anims.create({ key: ANIMS.coinSpin, frames: frames(KENNEY.tiles, TILES.coin, TILES.coinTurned), frameRate: 4, repeat: -1 })
  scene.anims.create({
    key: ANIMS.flyerFlap,
    frames: frames(KENNEY.characters, CHARS.batUp, CHARS.batMid, CHARS.batDown, CHARS.batMid),
    frameRate: 8,
    repeat: -1,
  })
  scene.anims.create({ key: ANIMS.flagWave, frames: frames(KENNEY.tiles, TILES.flag, TILES.flagWaving), frameRate: 4, repeat: -1 })
}

/** Couleur du ciel « jour » du pack (utilisée si la map Tiled n'a pas de couleur de fond). */
export const SKY_COLOR = '#dff6f5'
