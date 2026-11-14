import * as Phaser from 'phaser'
import { ART_SCALE, PALETTE } from '../art/palette'
import { UI_TEXT_STYLE } from './textStyle'

const color = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color

/** Gros bouton pixel art (souris et toucher), centré en (x, y). */
export class PixelButton extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Rectangle
  /** Parties qui descendent quand le bouton est enfoncé, avec leur y de repos. */
  private readonly movingParts: { part: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text; y: number }[]
  private pressed = false

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void) {
    super(scene, x, y)
    const b = ART_SCALE
    const width = 100
    const height = 24

    // Ombre portée sous le bouton, puis contour, face et reflet.
    const shadow = scene.add.rectangle(0, 2 * b, width, height, color(PALETTE.outline))
    const outline = scene.add.rectangle(0, 0, width, height, color(PALETTE.outline))
    this.face = scene.add.rectangle(0, 0, width - 2 * b, height - 2 * b, color(PALETTE.grass))
    const highlight = scene.add.rectangle(0, -height / 2 + 2 * b, width - 2 * b, 2 * b, color(PALETTE.grassLight))
    const label = scene.add.text(0, 0, text, { ...UI_TEXT_STYLE, fontSize: '12px' }).setOrigin(0.5)
    this.add([shadow, outline, this.face, highlight, label])
    this.movingParts = [outline, this.face, highlight, label].map((part) => ({ part, y: part.y }))

    this.setSize(width, height)
    this.setInteractive({ useHandCursor: true })
    this.on('pointerover', () => this.setHover(true))
    this.on('pointerout', () => {
      this.setHover(false)
      this.setPressed(false)
    })
    this.on('pointerdown', () => this.setPressed(true))
    this.on('pointerup', () => {
      if (!this.pressed) return
      this.setPressed(false)
      onClick()
    })

    scene.add.existing(this)
  }

  private setHover(hover: boolean) {
    this.face.setFillStyle(color(hover ? PALETTE.grassLight : PALETTE.grass))
  }

  /** Enfoncé : le bouton descend sur son ombre et s'assombrit. */
  setPressed(pressed: boolean) {
    this.pressed = pressed
    const offset = pressed ? 2 * ART_SCALE : 0
    for (const { part, y } of this.movingParts) part.y = y + offset
    this.face.setFillStyle(color(pressed ? PALETTE.grassDark : PALETTE.grass))
  }
}
