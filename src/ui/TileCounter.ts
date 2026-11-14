import * as Phaser from 'phaser'
import { KENNEY, TILES } from '../art/kenneyTiles'

// Les glyphes du pack (tuiles de 18 px) font environ 12 px de large.
const GLYPH_SPACING = 12
const ICON_GAP = 2

export type TileCounterOptions = {
  /** Icône (texture, et image si c'est une planche). */
  icon: string
  iconFrame?: number
  value: number
}

/** Compteur « icône x 12 » écrit avec la police du pack, fixe à l'écran. */
export class TileCounter extends Phaser.GameObjects.Container {
  private readonly glyphs: Phaser.GameObjects.Image[] = []
  private readonly textX: number
  private value = -1

  constructor(scene: Phaser.Scene, x: number, y: number, options: TileCounterOptions) {
    super(scene, x, y)
    const icon = scene.add.image(0, 0, options.icon, options.iconFrame).setOrigin(0, 0.5)
    this.add(icon)
    this.textX = icon.width + ICON_GAP

    scene.add.existing(this)
    this.setScrollFactor(0, 0, true)
    this.setDepth(1000)
    this.setValue(options.value)
  }

  /** Position à l'écran du centre de l'icône (cible des shurikens qui volent vers le compteur). */
  get iconCenter() {
    const icon = this.list[0] as Phaser.GameObjects.Image
    return { x: this.x + icon.width / 2, y: this.y }
  }

  setValue(value: number) {
    if (value === this.value) return
    const changed = this.value >= 0
    this.value = value

    for (const glyph of this.glyphs) glyph.destroy()
    this.glyphs.length = 0
    const frames = [TILES.times, ...String(value).split('').map((d) => TILES.digit0 + Number(d))]
    frames.forEach((frame, i) => {
      // Un espace après le « x ».
      const x = this.textX + i * GLYPH_SPACING + (i > 0 ? 2 : 0)
      this.glyphs.push(this.scene.add.image(x, 0, KENNEY.tiles, frame).setOrigin(0, 0.5))
    })
    this.add(this.glyphs)

    // Petit « pop » des chiffres à chaque changement.
    if (changed) {
      this.scene.tweens.add({ targets: this.glyphs.slice(1), y: -2, duration: 80, yoyo: true })
    }
  }
}
