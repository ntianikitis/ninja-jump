import type { LevelData } from './types'

// Un écran = 960 de large. Le saut monte à ~155 et couvre ~270 en longueur.
export const level1: LevelData = {
  width: 5280,
  spawnX: 100,
  objects: [
    // Écran 1 : prise en main.
    { type: 'block', x: 400, w: 40, h: 40 },
    { type: 'block', x: 700, w: 40, h: 40 },

    // Écran 2 : bloc moyen et premier petit trou.
    { type: 'block', x: 1100, w: 50, h: 80 },
    { type: 'hole', x: 1400, w: 100 },
    { type: 'block', x: 1750, w: 40, h: 40 },

    // Écran 3 : premier ennemi seul, puis checkpoint au milieu du niveau.
    { type: 'enemy', x: 2250 },
    { type: 'checkpoint', x: 2700 },

    // Écran 4 : escalier, trou plus large, puis un ennemi (avec de la place pour atterrir).
    { type: 'block', x: 2950, w: 50, h: 40 },
    { type: 'block', x: 3000, w: 50, h: 80 },
    { type: 'block', x: 3050, w: 50, h: 110 },
    { type: 'hole', x: 3250, w: 130 },
    { type: 'enemy', x: 3700 },

    // Écrans 5 et 6 : deux ennemis séparés par le plus grand trou, puis l'arrivée.
    { type: 'enemy', x: 4100 },
    { type: 'hole', x: 4350, w: 150 },
    { type: 'enemy', x: 4750 },
    { type: 'finish', x: 5150 },
  ],
}
