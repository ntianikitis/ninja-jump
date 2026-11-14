import * as Phaser from 'phaser'
import { StatBar, type StatBarOptions } from './StatBar'

const MARGIN = 16
const ROW_HEIGHT = 24

/** Interface fixe en haut à gauche : les barres s'empilent les unes sous les autres. */
export class Hud {
  private readonly scene: Phaser.Scene
  private nextY = MARGIN + ROW_HEIGHT / 2

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  addBar(options: StatBarOptions) {
    const bar = new StatBar(this.scene, MARGIN, this.nextY, options)
    this.nextY += ROW_HEIGHT
    return bar
  }
}
