import * as Phaser from 'phaser'
import { ANIMS, CHARS, KENNEY } from '../art/kenneyTiles'
import { PX_ANIMS, TEX } from '../art/pixelTextures'
import { ENEMY_PATROL_DISTANCE, ENEMY_SPEED } from '../config'

// Hitbox dans l'image de 24x24 : le corps de la bestiole, sans la pointe du casque.
const HITBOX = { width: 14, height: 13, offsetX: 5, offsetY: 11 }

/** Ennemi (bestiole du pack Kenney) qui patrouille autour de sa position de départ ; y = ses pieds. */
export class Enemy extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private readonly minX: number
  private readonly maxX: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KENNEY.characters, CHARS.spikyWalk1)
    this.setOrigin(0.5, 1)

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(HITBOX.width, HITBOX.height, false).setOffset(HITBOX.offsetX, HITBOX.offsetY)
    this.play(ANIMS.enemyWalk)
    this.body.setAllowGravity(false)
    this.body.setImmovable(true)
    this.body.setVelocityX(ENEMY_SPEED)

    this.minX = x - ENEMY_PATROL_DISTANCE / 2
    this.maxX = x + ENEMY_PATROL_DISTANCE / 2
  }

  /** Touché par un shuriken : petit nuage de fumée, puis disparition. */
  defeat() {
    this.body.enable = false
    const poof = this.scene.add.sprite(this.x, this.y - 8, TEX.poof[0]).play(PX_ANIMS.poof)
    poof.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => poof.destroy())
    this.destroy()
  }

  update() {
    if (this.x >= this.maxX && this.body.velocity.x > 0) {
      this.body.setVelocityX(-ENEMY_SPEED)
    } else if (this.x <= this.minX && this.body.velocity.x < 0) {
      this.body.setVelocityX(ENEMY_SPEED)
    }
  }
}
