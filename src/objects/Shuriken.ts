import * as Phaser from 'phaser'
import { TEX } from '../art/pixelTextures'
import { SHURIKEN_RANGE, SHURIKEN_SPEED } from '../config'

const SPIN_DEG_PER_S = 900

/** Shuriken lancé : vole tout droit en tournant, et disparaît après SHURIKEN_RANGE. */
export class Shuriken extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private readonly startX: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.shuriken)
    this.startX = x
    scene.add.existing(this)
  }

  /** À appeler après l'ajout au groupe physique (qui applique ses réglages par défaut). */
  launch(direction: 1 | -1) {
    this.body.setSize(7, 7)
    this.body.setVelocityX(direction * SHURIKEN_SPEED)
    this.body.setAngularVelocity(direction * SPIN_DEG_PER_S)
  }

  update() {
    if (Math.abs(this.x - this.startX) >= SHURIKEN_RANGE) this.destroy()
  }
}
