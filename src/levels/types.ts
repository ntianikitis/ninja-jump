// Toutes les positions sont en tuiles (1 tuile = 18 px) : x = colonne depuis le bord gauche,
// y = rangée au-dessus du sol (1 = juste au-dessus du sol).
export type LevelObject =
  /** Bloc posé sur le sol ; x = colonne de gauche, w = largeur, h = hauteur (en tuiles). */
  | { type: 'block'; x: number; w: number; h: number }
  /** Trou dans le sol ; x = colonne de gauche, w = largeur (en tuiles). */
  | { type: 'hole'; x: number; w: number }
  /** Ennemi ; x = colonne au centre de sa patrouille (doit rester au-dessus du sol). */
  | { type: 'enemy'; x: number }
  /** Point de reprise après la perte d'une vie. */
  | { type: 'checkpoint'; x: number }
  /** Drapeau d'arrivée. */
  | { type: 'finish'; x: number }
  /** Cœur à ramasser (+1 cœur) ; y = rangée au-dessus du sol (1 par défaut). */
  | { type: 'heart'; x: number; y?: number }
  /** Pièce à collectionner (score) ; y = rangée au-dessus du sol (1 par défaut). */
  | { type: 'coin'; x: number; y?: number }
  /** Coffre à shurikens ; y = rangée où il est posé (1 = sur le sol, 4 = sur un bloc de 3). */
  | { type: 'chest'; x: number; y?: number; shurikens?: number }

export type LevelData = {
  /** Largeur du niveau, en tuiles. */
  width: number
  /** Colonne de départ du joueur. */
  spawnX: number
  objects: LevelObject[]
}
