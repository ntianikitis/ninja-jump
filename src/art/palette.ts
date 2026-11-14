// 1 pixel d'art = ART_SCALE pixels du jeu (le jeu est déjà en résolution pixel art, 320x180).
export const ART_SCALE = 1

// Couleurs reprises du pack Kenney « Pixel Platformer », pour l'interface et les dessins maison.
export const PALETTE = {
  outline: '#434a5f',
  woodOutline: '#6f3e43',
  wood: '#cb815e',
  woodLight: '#f4ac66',
  grass: '#2eb082',
  grassLight: '#36e377',
  grassDark: '#22805f',
  red: '#fc683b',
  coin: '#fee481',
  gold: '#f4b41b',
  woodDark: '#9f5a52',
  metal: '#959ab1',
  metalLight: '#dce1e7',
  shadow: '#2b2f3d',
  // Tête de ninja (vies).
  hood: '#4f5670',
  hoodDark: '#383e52',
  skin: '#f4ac66',
} as const
