import * as Phaser from 'phaser'
import {
  getCharacterManifest,
  PLAYER_TEXTURE,
  playerAnimKey,
  type PlayerAnim,
} from '../characters/playerAssets'
import {
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  PLAYER_HURT_MS,
  PLAYER_SPEED,
} from '../config'
import type { InputController } from '../input/InputController'

export class Player extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private spawnX: number
  private spawnY: number
  private lastGroundedAt = -Infinity
  private jumpRequestedAt = -Infinity
  private hurt = false
  private celebrating = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE)
    this.spawnX = x
    this.spawnY = y

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)

    // Hitbox ajustée au corps, centrée pour rester juste quand le sprite est retourné.
    const { scale, hitbox } = getCharacterManifest(scene)
    this.setScale(scale)
    this.body.setSize(hitbox.width, hitbox.height, false)
    this.body.setOffset((this.width - hitbox.width) / 2, hitbox.bottom - hitbox.height)

    this.playAnim('idle')
  }

  update(input: InputController) {
    if (this.hurt || this.celebrating) return

    const body = this.body
    const now = this.scene.time.now

    if (input.left === input.right) {
      body.setVelocityX(0)
    } else {
      body.setVelocityX(input.left ? -PLAYER_SPEED : PLAYER_SPEED)
    }

    const grounded = body.blocked.down || body.touching.down
    if (grounded) {
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

    this.updateAnimation(grounded)
  }

  setSpawn(x: number, y: number) {
    this.spawnX = x
    this.spawnY = y
  }

  /** Touché par un ennemi : courte animation, puis retour au checkpoint. */
  hit() {
    if (this.hurt || this.celebrating) return
    this.hurt = true
    this.freeze()
    this.playAnim('hurt')

    this.scene.time.delayedCall(PLAYER_HURT_MS, () => {
      this.hurt = false
      this.body.moves = true
      this.respawn()
    })
  }

  /** Arrivée atteinte : le joueur s'arrête et fête sa victoire. */
  celebrate() {
    this.celebrating = true
    this.freeze()
    this.playAnim('victory')
  }

  /** Retour au départ, sans game over : le joueur clignote brièvement. */
  respawn() {
    this.body.reset(this.spawnX, this.spawnY)
    this.lastGroundedAt = -Infinity
    this.jumpRequestedAt = -Infinity
    this.playAnim('idle')

    this.scene.tweens.killTweensOf(this)
    this.setAlpha(1)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 2,
    })
  }

  private updateAnimation(grounded: boolean) {
    const { velocity } = this.body

    // Les images regardent vers la droite ; on garde la dernière direction à l'arrêt.
    if (velocity.x < 0) this.setFlipX(true)
    else if (velocity.x > 0) this.setFlipX(false)

    if (!grounded) {
      this.playAnim(velocity.y < 0 ? 'jump' : 'fall')
    } else {
      this.playAnim(velocity.x !== 0 ? 'run' : 'idle')
    }
  }

  private freeze() {
    this.body.stop()
    this.body.moves = false
  }

  private playAnim(anim: PlayerAnim) {
    this.play(playerAnimKey(anim), true)
  }
}
