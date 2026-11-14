import * as Phaser from 'phaser'
import { ART_SCALE, PALETTE } from '../art/palette'

const color = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color

/** Panneau pixel art centré en (x, y) : contour sombre, fond, reflet en haut. */
export class PixelPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y)
    const b = ART_SCALE
    this.add([
      scene.add.rectangle(0, 0, width, height, color(PALETTE.hudOutline)),
      scene.add.rectangle(0, 0, width - 2 * b, height - 2 * b, color(PALETTE.panel)),
      scene.add.rectangle(0, -height / 2 + 2 * b, width - 2 * b, 2 * b, color(PALETTE.panelLight)),
    ])
    scene.add.existing(this)
  }
}
