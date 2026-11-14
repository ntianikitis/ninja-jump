import * as Phaser from 'phaser'
import { ART_SCALE } from '../art/palette'
import { TEX } from '../art/pixelTextures'

const GAP = 1 // pixels d'art entre deux têtes

/** Vies restantes : une petite tête de ninja par vie, fixe à l'écran. */
export class LivesCounter extends Phaser.GameObjects.Container {
  private readonly heads: Phaser.GameObjects.Image[]

  constructor(scene: Phaser.Scene, x: number, y: number, lives: number) {
    super(scene, x, y)
    this.heads = Array.from({ length: lives }, (_, i) => {
      const head = scene.add.image(0, 0, TEX.ninjaHead).setOrigin(0, 0.5).setScale(ART_SCALE)
      head.x = i * (head.width + GAP) * ART_SCALE
      return head
    })
    this.add(this.heads)

    scene.add.existing(this)
    this.setScrollFactor(0, 0, true)
    this.setDepth(1000)
  }

  /** Affiche exactement `lives` têtes, sans animation. */
  setLives(lives: number) {
    this.heads.forEach((head, i) => {
      this.scene.tweens.killTweensOf(head)
      head.setAlpha(1).setVisible(i < lives)
    })
  }

  /** La dernière tête visible clignote puis disparaît en `duration` ms. */
  loseLife(duration: number) {
    const head = [...this.heads].reverse().find((h) => h.visible)
    if (!head) return
    this.scene.tweens.add({
      targets: head,
      alpha: 0,
      duration: duration / 8,
      yoyo: true,
      repeat: 3,
      onComplete: () => head.setVisible(false),
    })
  }
}
