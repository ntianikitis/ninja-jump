import type { LevelData } from './types'

// En tuiles : un écran = environ 18 colonnes. Le saut monte à ~3 tuiles et couvre ~5 colonnes.
export const level1: LevelData = {
  width: 107,
  spawnX: 2,
  objects: [
    // Écran 1 : prise en main.
    { type: 'block', x: 7, w: 1, h: 1 },
    { type: 'coin', x: 7, y: 3 },
    { type: 'block', x: 13, w: 1, h: 1 },
    { type: 'coin', x: 13, y: 3 },

    // Écran 2 : bloc plus haut et premier petit trou.
    { type: 'block', x: 20, w: 1, h: 2 },
    { type: 'coin', x: 20, y: 4 },
    { type: 'hole', x: 26, w: 2 },
    { type: 'coin', x: 27, y: 3 },
    { type: 'chest', x: 30 }, // premier coffre, facile : découverte des shurikens
    { type: 'block', x: 32, w: 1, h: 1 },
    { type: 'coin', x: 32, y: 3 },
    { type: 'enemy', x: 37 }, // à 2 tuiles du bloc : on n'atterrit pas dessus en sautant le bloc

    // Écran 3 : premier ennemi seul, puis checkpoint au milieu du niveau.
    { type: 'enemy', x: 42 },
    { type: 'coin', x: 42, y: 3 },
    { type: 'heart', x: 46 },
    { type: 'coin', x: 48 },
    { type: 'checkpoint', x: 50 },

    // Écran 4 : escalier, trou plus large, puis un ennemi (avec de la place pour atterrir).
    { type: 'block', x: 55, w: 1, h: 1 },
    { type: 'coin', x: 55, y: 3 },
    { type: 'block', x: 56, w: 1, h: 2 },
    { type: 'block', x: 57, w: 1, h: 3 },
    { type: 'heart', x: 57, y: 5 }, // récompense en haut de l'escalier
    // 3 tuiles d'élan après l'escalier : en descendant de la marche, on ne tombe pas dans le trou.
    { type: 'hole', x: 61, w: 3 },
    { type: 'coin', x: 62, y: 3 },
    { type: 'enemy', x: 69 },

    // Écrans 5 et 6 : coffre difficile sur un pilier entre deux ennemis, le plus grand trou,
    // dernier coffre, puis deux ennemis avant l'arrivée.
    { type: 'heart', x: 72 },
    { type: 'block', x: 73, w: 1, h: 2 },
    { type: 'block', x: 74, w: 1, h: 3 },
    { type: 'chest', x: 74, y: 4 }, // coffre difficile d'accès
    // Après le pilier : 4 tuiles pour atterrir avant la patrouille, 2 tuiles entre la patrouille et le trou.
    { type: 'enemy', x: 83 },
    { type: 'coin', x: 83, y: 3 },
    { type: 'hole', x: 88, w: 3 },
    { type: 'coin', x: 89, y: 3 },
    { type: 'chest', x: 92 },
    { type: 'enemy', x: 96 },
    { type: 'coin', x: 96, y: 3 },
    { type: 'enemy', x: 101 },
    { type: 'coin', x: 102, y: 3 },
    { type: 'finish', x: 104 },
  ],
}
