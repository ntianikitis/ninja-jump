// Pack Kenney « Pixel Platformer » (CC0), planches copiées dans public/assets/kenney/.
import type * as Phaser from 'phaser'

export const KENNEY = {
  tiles: 'kenney-tiles',
  backgrounds: 'kenney-backgrounds',
  characters: 'kenney-characters',
} as const

/** Taille d'une tuile de tiles.png (px). */
export const TILE_SIZE = 18
/** Taille d'une tuile de backgrounds.png et d'un personnage de characters.png (px). */
export const BG_TILE_SIZE = 24
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
} as const

// Numéro d'un personnage de characters.png = ligne × 9 + colonne.
export const CHARS = {
  // Bestiole à casque à pointes (2 images de marche).
  spikyWalk1: 15,
  spikyWalk2: 16,
} as const

export const ANIMS = {
  enemyWalk: 'enemy-walk',
  coinSpin: 'coin-spin',
  flagWave: 'flag-wave',
} as const

/** Animations des éléments du pack (à créer une fois, dans BootScene). */
export function createKenneyAnimations(scene: Phaser.Scene) {
  const frames = (key: string, ...ids: number[]) => ids.map((frame) => ({ key, frame }))
  scene.anims.create({ key: ANIMS.enemyWalk, frames: frames(KENNEY.characters, CHARS.spikyWalk1, CHARS.spikyWalk2), frameRate: 6, repeat: -1 })
  scene.anims.create({ key: ANIMS.coinSpin, frames: frames(KENNEY.tiles, TILES.coin, TILES.coinTurned), frameRate: 4, repeat: -1 })
  scene.anims.create({ key: ANIMS.flagWave, frames: frames(KENNEY.tiles, TILES.flag, TILES.flagWaving), frameRate: 4, repeat: -1 })
}

// backgrounds.png : 8 colonnes ; les colonnes 0 à 3 forment le fond « jour ».
export const BG = {
  columns: 8,
  dayColumns: 4,
  /** Ligne 1 : nuages et arbres à l'horizon ; ligne 2 : bas uni. */
  horizonRow: 1,
  lowRow: 2,
} as const

/** Couleur du ciel « jour » (ligne 0 de backgrounds.png). */
export const SKY_COLOR = '#dff6f5'
