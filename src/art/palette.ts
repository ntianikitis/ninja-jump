// 1 pixel d'art = ART_SCALE unités de jeu (le jeu « pense » en 480x270).
export const ART_SCALE = 2

export const PALETTE = {
  // Ciel, du haut (foncé) vers l'horizon (clair).
  sky: ['#2a5fc4', '#3170d0', '#3a80da', '#4690e2', '#55a0ea', '#68b2f0', '#7fc4f5', '#9ad5f8'],
  cloud: '#ffffff',
  cloudShade: '#c9dcf0',
  cloudEdge: '#a9c3e0',
  grassLight: '#8ee04a',
  grass: '#55b62e',
  grassDark: '#2f7d22',
  dirtLight: '#a8683a',
  dirt: '#8a5230',
  dirtDark: '#5e3420',
  outline: '#3a2014',
  // Interface : cœurs et barres.
  heartLight: '#ff8a96',
  heart: '#e8344a',
  heartDark: '#9c1830',
  hudOutline: '#1a1424',
  barEmpty: '#4a3a46',
  barEmptyLight: '#5e4c5a',
  flash: '#ffffff',
  starLight: '#fff6b0',
  star: '#ffd23f',
  starDark: '#c98a12',
  hood: '#3b3f52',
  hoodDark: '#262838',
  skin: '#f2c29b',
  panel: '#2b2d42',
  panelLight: '#3d4060',
  button: '#55b62e',
  buttonLight: '#8ee04a',
  buttonDark: '#2f7d22',
} as const
