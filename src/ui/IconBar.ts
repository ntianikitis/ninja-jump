import * as Phaser from 'phaser'

export type IconBarOptions = {
  /** Planche contenant les icônes (ex. KENNEY.tiles). */
  texture: string
  fullFrame: number
  emptyFrame: number
  /** Image montrée un instant quand une icône se vide (ex. demi-cœur). */
  lostFrame?: number
  max: number
  value?: number
  /** Écart entre deux icônes (px). */
  spacing: number
}

const LOST_MS = 150

/** Rangée d'icônes pleines ou vides (cœurs, énergie…), fixe à l'écran. */
export class IconBar extends Phaser.GameObjects.Container {
  private readonly options: IconBarOptions
  private icons: Phaser.GameObjects.Image[] = []
  private value = 0

  constructor(scene: Phaser.Scene, x: number, y: number, options: IconBarOptions) {
    super(scene, x, y)
    this.options = options

    scene.add.existing(this)
    this.setScrollFactor(0, 0, true)
    this.setDepth(1000)

    this.setMax(options.max)
    this.setValue(options.value ?? options.max)
  }

  /** Bord droit de la rangée, pour placer un élément à côté. */
  get right() {
    const last = this.icons[this.icons.length - 1]
    return this.x + (last ? last.x + last.width : 0)
  }

  setMax(max: number) {
    for (const icon of this.icons) icon.destroy()
    const { texture, emptyFrame, spacing } = this.options
    this.icons = Array.from({ length: max }, (_, i) =>
      this.scene.add.image(i * spacing, 0, texture, emptyFrame).setOrigin(0, 0.5),
    )
    this.add(this.icons)
    this.setValue(Math.min(this.value, max))
  }

  setValue(value: number) {
    const previous = this.value
    this.value = Phaser.Math.Clamp(value, 0, this.icons.length)
    this.refresh()

    // Les icônes perdues passent un instant par l'image « perdue » (ex. demi-cœur).
    const { lostFrame } = this.options
    if (lostFrame !== undefined && this.value < previous) {
      for (const icon of this.icons.slice(this.value, previous)) icon.setFrame(lostFrame)
      this.scene.time.delayedCall(LOST_MS, () => this.refresh())
    }
  }

  private refresh() {
    const { fullFrame, emptyFrame } = this.options
    this.icons.forEach((icon, i) => {
      if (icon.active) icon.setFrame(i < this.value ? fullFrame : emptyFrame)
    })
  }
}
