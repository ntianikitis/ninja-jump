// 1 pixel d'art = ART_SCALE pixels du jeu (le jeu est déjà en résolution pixel art, 320x180).
export const ART_SCALE = 1

export const PALETTE = {
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
