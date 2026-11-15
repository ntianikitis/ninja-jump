import * as Phaser from 'phaser'
import { ANIMS, CHARS, KENNEY } from '../art/kenneyTiles'
import { PX_ANIMS, TEX } from '../art/pixelTextures'
import { ENEMY_PATROL_DISTANCE, ENEMY_SPEED } from '../config'

export type EnemyLook = {
  frame: number
  anim: string
  /** Hitbox dans l'image de 24x24. */
  hitbox: { width: number; height: number; offsetX: number; offsetY: number }
  speed: number
}

// Bestiole à casque : hitbox = le corps, sans la pointe du casque.
const SPIKY: EnemyLook = {
  frame: CHARS.spikyWalk1,
  anim: ANIMS.enemyWalk,
  hitbox: { width: 14, height: 13, offsetX: 5, offsetY: 11 },
  speed: ENEMY_SPEED,
}

/** Ennemi du pack Kenney qui patrouille autour de sa position de départ ; y = ses pieds. */
export class Enemy extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private readonly minX: number
  private readonly maxX: number
  private readonly speed: number

  /** `patrolDistance` : distance totale parcourue entre les deux demi-tours (px). */
  constructor(scene: Phaser.Scene, x: number, y: number, patrolDistance = ENEMY_PATROL_DISTANCE, look = SPIKY) {
    super(scene, x, y, KENNEY.characters, look.frame)
    this.setOrigin(0.5, 1)
    this.speed = look.speed

    scene.add.existing(this)
    scene.physics.add.existing(this)
    const { width, height, offsetX, offsetY } = look.hitbox
    this.body.setSize(width, height, false).setOffset(offsetX, offsetY)
    this.play(look.anim)
    this.body.setAllowGravity(false)
    this.body.setImmovable(true)
    this.body.setVelocityX(this.speed)

    this.minX = x - patrolDistance / 2
    this.maxX = x + patrolDistance / 2
  }

  /** Touché par un shuriken : petit nuage de fumée, puis disparition. */
  defeat() {
    this.body.enable = false
    const poof = this.scene.add.sprite(this.x, this.y - 8, TEX.poof[0]).play(PX_ANIMS.poof)
    poof.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => poof.destroy())
    this.destroy()
  }

  update(_time?: number, _delta?: number) {
    if (this.x >= this.maxX && this.body.velocity.x > 0) {
      this.body.setVelocityX(-this.speed)
    } else if (this.x <= this.minX && this.body.velocity.x < 0) {
      this.body.setVelocityX(this.speed)
    }
  }
}
