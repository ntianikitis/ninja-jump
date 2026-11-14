// Pack Kenney « Pixel Platformer » (CC0), planches copiées dans public/assets/kenney/.
export const KENNEY = {
  tiles: 'kenney-tiles',
  backgrounds: 'kenney-backgrounds',
} as const

/** Taille d'une tuile de tiles.png (px). */
export const TILE_SIZE = 18
/** Taille d'une tuile de backgrounds.png (px). */
export const BG_TILE_SIZE = 24

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
} as const

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
