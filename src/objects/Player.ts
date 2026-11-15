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
  KNOCKBACK_MS,
  KNOCKBACK_X,
  KNOCKBACK_Y,
  PLAYER_INVINCIBLE_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_SPEED,
} from '../config'
import type { InputController } from '../input/InputController'

/** Émis avec le nouveau nombre de cœurs à chaque changement. */
export const HEALTH_CHANGED = 'health-changed'
/** Émis quand le dernier cœur est perdu : la scène retire alors une vie. */
export const HEALTH_DEPLETED = 'health-depleted'

const RESPAWN_BLINK_MS = 600

export class Player extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  health = PLAYER_MAX_HEALTH

  private spawnX: number
  private spawnY: number
  private lastGroundedAt = -Infinity
  private jumpRequestedAt = -Infinity
  private knockbackUntil = -Infinity
  private invincibleUntil = -Infinity
  /** Figé : perte d'une vie en cours, ou victoire. */
  private frozen = false

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
    if (this.frozen) return

    const body = this.body
    const now = this.scene.time.now

    // Pendant le recul, le joueur ne contrôle pas le personnage.
    if (now < this.knockbackUntil) return

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

  /** Direction du regard : 1 = droite, -1 = gauche (les images regardent vers la droite). */
  get facing(): 1 | -1 {
    return this.flipX ? -1 : 1
  }

  /** Peut agir (lancer…) : ni figé, ni en plein recul. */
  get canAct() {
    return !this.frozen && this.scene.time.now >= this.knockbackUntil
  }

  setSpawn(x: number, y: number) {
    this.spawnX = x
    this.spawnY = y
  }

  /** Touché par un ennemi situé en sourceX : −1 cœur, recul et invincibilité. */
  hit(sourceX: number) {
    const now = this.scene.time.now
    if (this.frozen || now < this.invincibleUntil) return

    this.setHealth(this.health - 1)
    this.playAnim('hurt')

    if (this.health === 0) {
      this.freeze()
      this.emit(HEALTH_DEPLETED)
      return
    }

    const direction = this.x < sourceX ? -1 : 1
    this.body.setVelocity(direction * KNOCKBACK_X, KNOCKBACK_Y)
    this.knockbackUntil = now + KNOCKBACK_MS
    this.invincibleUntil = now + PLAYER_INVINCIBLE_MS
    this.blink(PLAYER_INVINCIBLE_MS)
  }

  /** +1 cœur ; renvoie false si la barre est déjà pleine (le cœur n'est pas consommé). */
  heal() {
    if (this.health >= PLAYER_MAX_HEALTH) return false
    this.setHealth(this.health + 1)
    return true
  }

  /** Projeté vers le haut (ressort) : remplace un saut normal. */
  bounce(velocityY: number) {
    this.body.setVelocityY(velocityY)
    this.lastGroundedAt = -Infinity
    this.jumpRequestedAt = -Infinity
    this.playAnim('jump')
  }

  /** Arrivée atteinte : le joueur s'arrête et fête sa victoire. */
  celebrate() {
    this.freeze()
    this.playAnim('victory')
  }

  /** Immobilise le joueur (perte d'une vie, victoire) jusqu'au prochain respawn(). */
  freeze() {
    this.frozen = true
    this.body.stop()
    this.body.moves = false
  }

  /** Retour au dernier checkpoint avec tous les cœurs. */
  respawn() {
    this.frozen = false
    this.body.moves = true
    this.setHealth(PLAYER_MAX_HEALTH)

    this.body.reset(this.spawnX, this.spawnY)
    this.lastGroundedAt = -Infinity
    this.jumpRequestedAt = -Infinity
    this.knockbackUntil = -Infinity
    this.invincibleUntil = this.scene.time.now + RESPAWN_BLINK_MS
    this.playAnim('idle')
    this.blink(RESPAWN_BLINK_MS)
  }

  private setHealth(value: number) {
    this.health = Phaser.Math.Clamp(value, 0, PLAYER_MAX_HEALTH)
    this.emit(HEALTH_CHANGED, this.health)
  }

  private blink(duration: number) {
    this.scene.tweens.killTweensOf(this)
    this.setAlpha(1)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: Math.max(0, Math.round(duration / 200) - 1),
      onComplete: () => this.setAlpha(1),
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

  private playAnim(anim: PlayerAnim) {
    this.play(playerAnimKey(anim), true)
  }
}
