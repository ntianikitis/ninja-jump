import * as Phaser from 'phaser'
import { ENEMY_PATROL_DISTANCE, ENEMY_SPEED } from '../config'

const SIZE = 40

/** Ennemi qui patrouille à gauche et à droite autour de sa position de départ. */
export class Enemy extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body

  private readonly minX: number
  private readonly maxX: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, SIZE, SIZE, 0xe63946)

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setAllowGravity(false)
    this.body.setImmovable(true)
    this.body.setVelocityX(ENEMY_SPEED)

    this.minX = x - ENEMY_PATROL_DISTANCE / 2
    this.maxX = x + ENEMY_PATROL_DISTANCE / 2
  }

  update() {
    if (this.x >= this.maxX && this.body.velocity.x > 0) {
      this.body.setVelocityX(-ENEMY_SPEED)
    } else if (this.x <= this.minX && this.body.velocity.x < 0) {
      this.body.setVelocityX(ENEMY_SPEED)
    }
  }
}
