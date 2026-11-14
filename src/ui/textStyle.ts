import type * as Phaser from 'phaser'
import { PALETTE } from '../art/palette'

/** Style commun des textes d'interface (police système grasse avec contour). */
export const UI_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'system-ui, sans-serif',
  fontStyle: 'bold',
  color: '#ffffff',
  stroke: PALETTE.outline,
  strokeThickness: 2,
}
