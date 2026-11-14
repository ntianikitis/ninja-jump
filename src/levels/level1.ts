import type { LevelData } from './types'

// En tuiles : un écran = environ 18 colonnes. Le saut monte à ~3 tuiles et couvre ~5 colonnes.
export const level1: LevelData = {
  width: 98,
  spawnX: 2,
  objects: [
    // Écran 1 : prise en main.
    { type: 'block', x: 7, w: 1, h: 1 },
    { type: 'star', x: 7, y: 3 },
    { type: 'block', x: 13, w: 1, h: 1 },
    { type: 'star', x: 13, y: 3 },

    // Écran 2 : bloc plus haut et premier petit trou.
    { type: 'block', x: 20, w: 1, h: 2 },
    { type: 'star', x: 20, y: 4 },
    { type: 'hole', x: 26, w: 2 },
    { type: 'star', x: 27, y: 3 },
    { type: 'block', x: 32, w: 1, h: 1 },
    { type: 'star', x: 32, y: 3 },

    // Écran 3 : premier ennemi seul, puis checkpoint au milieu du niveau.
    { type: 'enemy', x: 42 },
    { type: 'star', x: 42, y: 3 },
    { type: 'heart', x: 46 },
    { type: 'star', x: 48 },
    { type: 'checkpoint', x: 50 },

    // Écran 4 : escalier, trou plus large, puis un ennemi (avec de la place pour atterrir).
    { type: 'block', x: 55, w: 1, h: 1 },
    { type: 'star', x: 55, y: 3 },
    { type: 'block', x: 56, w: 1, h: 2 },
    { type: 'block', x: 57, w: 1, h: 3 },
    { type: 'heart', x: 57, y: 5 }, // récompense en haut de l'escalier
    // 3 tuiles d'élan après l'escalier : en descendant de la marche, on ne tombe pas dans le trou.
    { type: 'hole', x: 61, w: 3 },
    { type: 'star', x: 62, y: 3 },
    { type: 'enemy', x: 69 },

    // Écrans 5 et 6 : deux ennemis séparés par le plus grand trou, puis l'arrivée.
    { type: 'heart', x: 72 },
    { type: 'enemy', x: 76 },
    { type: 'star', x: 76, y: 3 },
    { type: 'hole', x: 80, w: 3 },
    { type: 'star', x: 81, y: 3 },
    { type: 'enemy', x: 88 },
    { type: 'star', x: 88, y: 3 },
    { type: 'star', x: 93 },
    { type: 'finish', x: 95 },
  ],
}
