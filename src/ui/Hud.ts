import * as Phaser from 'phaser'
import { IconBar, type IconBarOptions } from './IconBar'

const MARGIN = 4
const ROW_HEIGHT = 16

/** Interface fixe en haut à gauche : les rangées d'icônes s'empilent les unes sous les autres. */
export class Hud {
  private readonly scene: Phaser.Scene
  private nextY = MARGIN + ROW_HEIGHT / 2

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  addBar(options: IconBarOptions) {
    const bar = new IconBar(this.scene, MARGIN, this.nextY, options)
    this.nextY += ROW_HEIGHT
    return bar
  }
}
