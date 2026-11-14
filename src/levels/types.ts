// Tous les x sont en unités de jeu, mesurés depuis le bord gauche du niveau.
export type LevelObject =
  /** Bloc posé sur le sol ; x = bord gauche. */
  | { type: 'block'; x: number; w: number; h: number }
  /** Trou dans le sol ; x = bord gauche. */
  | { type: 'hole'; x: number; w: number }
  /** Ennemi ; x = centre de sa patrouille (doit rester au-dessus du sol). */
  | { type: 'enemy'; x: number }
  /** Point de reprise après une chute ou un ennemi. */
  | { type: 'checkpoint'; x: number }
  /** Drapeau d'arrivée. */
  | { type: 'finish'; x: number }
  /** Cœur à ramasser (+1 vie) ; y = hauteur de son centre au-dessus du sol (40 par défaut). */
  | { type: 'heart'; x: number; y?: number }

export type LevelData = {
  width: number
  spawnX: number
  objects: LevelObject[]
}
