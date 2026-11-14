import * as Phaser from 'phaser'
import { ART_SCALE } from '../art/palette'
import { BAR_SEGMENT_WIDTH, TEX } from '../art/pixelTextures'

export type StatBarOptions = {
  /** Texture de l'icône (ex. TEX.heart). */
  icon: string
  /** Texture d'un segment plein (ex. TEX.barRed). */
  fullTexture: string
  max: number
  value?: number
}

const ICON_GAP = 2 // pixels d'art entre l'icône et la barre
const FLASH_MS = 150

/** Barre d'interface pixel art : une icône + des segments pleins ou vides, fixe à l'écran. */
export class StatBar extends Phaser.GameObjects.Container {
  private readonly fullTexture: string
  private readonly segmentsX: number
  private segments: Phaser.GameObjects.Image[] = []
  private value = 0

  constructor(scene: Phaser.Scene, x: number, y: number, options: StatBarOptions) {
    super(scene, x, y)
    this.fullTexture = options.fullTexture

    const icon = scene.add.image(0, 0, options.icon).setOrigin(0, 0.5).setScale(ART_SCALE)
    this.add(icon)
    this.segmentsX = (icon.width + ICON_GAP) * ART_SCALE

    scene.add.existing(this)
    this.setScrollFactor(0, 0, true)
    this.setDepth(1000)

    this.setMax(options.max)
    this.setValue(options.value ?? options.max)
  }

  /** Bord droit de la barre, pour placer un élément à côté. */
  get right() {
    return this.x + this.segmentsX + (this.segments.length * (BAR_SEGMENT_WIDTH - 1) + 1) * ART_SCALE
  }

  setMax(max: number) {
    for (const segment of this.segments) segment.destroy()
    // Les segments se chevauchent d'1 pixel d'art pour partager leur contour.
    this.segments = Array.from({ length: max }, (_, i) =>
      this.scene.add
        .image(this.segmentsX + i * (BAR_SEGMENT_WIDTH - 1) * ART_SCALE, 0, TEX.barEmpty)
        .setOrigin(0, 0.5)
        .setScale(ART_SCALE),
    )
    this.add(this.segments)
    this.setValue(Math.min(this.value, max))
  }

  setValue(value: number) {
    const previous = this.value
    this.value = Phaser.Math.Clamp(value, 0, this.segments.length)
    this.refresh()

    // Les segments perdus clignotent en blanc un instant.
    if (this.value < previous) {
      const lost = this.segments.slice(this.value, previous)
      for (const segment of lost) segment.setTexture(TEX.barFlash)
      this.scene.time.delayedCall(FLASH_MS, () => this.refresh())
    }
  }

  private refresh() {
    this.segments.forEach((segment, i) => {
      if (segment.active) segment.setTexture(i < this.value ? this.fullTexture : TEX.barEmpty)
    })
  }
}
