import * as Phaser from 'phaser'
import { UI_OFFSET } from '../display'
import { IconBar, type IconBarOptions } from './IconBar'
import { TileCounter, type TileCounterOptions } from './TileCounter'

const MARGIN = 4
const ROW_HEIGHT = 16

/** Interface fixe en haut à gauche : les rangées (icônes, compteurs) s'empilent les unes sous les autres. */
export class Hud {
  private readonly scene: Phaser.Scene
  private nextY = UI_OFFSET.y + MARGIN + ROW_HEIGHT / 2

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  addBar(options: IconBarOptions) {
    const bar = new IconBar(this.scene, UI_OFFSET.x + MARGIN, this.nextY, options)
    this.nextY += ROW_HEIGHT
    return bar
  }

  addCounter(options: TileCounterOptions) {
    const counter = new TileCounter(this.scene, UI_OFFSET.x + MARGIN, this.nextY, options)
    this.nextY += ROW_HEIGHT
    return counter
  }
}
