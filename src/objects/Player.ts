import * as Phaser from 'phaser'
import {
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  PLAYER_SPEED,
} from '../config'
import type { InputController } from '../input/InputController'

const WIDTH = 40
const HEIGHT = 56

export class Player extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body

  private lastGroundedAt = -Infinity
  private jumpRequestedAt = -Infinity

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, WIDTH, HEIGHT, 0x1d3557)

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)
  }

  update(input: InputController) {
    const body = this.body
    const now = this.scene.time.now

    if (input.left === input.right) {
      body.setVelocityX(0)
    } else {
      body.setVelocityX(input.left ? -PLAYER_SPEED : PLAYER_SPEED)
    }

    if (body.blocked.down || body.touching.down) {
      this.lastGroundedAt = now
    }
    if (input.jumpPressed) {
      this.jumpRequestedAt = now
    }

    // Coyote time : saut encore permis juste après avoir quitté le sol.
    // Mémoire du saut : un appui juste avant l'atterrissage est conservé.
    const canJump = now - this.lastGroundedAt <= COYOTE_TIME_MS
    const wantsJump = now - this.jumpRequestedAt <= JUMP_BUFFER_MS

    if (canJump && wantsJump) {
      body.setVelocityY(JUMP_VELOCITY)
      this.lastGroundedAt = -Infinity
      this.jumpRequestedAt = -Infinity
    }
  }
}
