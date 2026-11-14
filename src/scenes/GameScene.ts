import * as Phaser from 'phaser'
import { InputController } from '../input/InputController'
import { Enemy } from '../objects/Enemy'
import { Player } from '../objects/Player'

type Block = { x: number; y: number; w: number; h: number; color: number }

const GROUND_TOP = 500
const GROUND_COLOR = 0x2d6a4f
const BLOCK_COLOR = 0x8d5524

// Niveau d'un écran : x / y = coin haut gauche.
const LEVEL: Block[] = [
  // Sol, avec un trou entre 520 et 640.
  { x: 0, y: GROUND_TOP, w: 520, h: 40, color: GROUND_COLOR },
  { x: 640, y: GROUND_TOP, w: 320, h: 40, color: GROUND_COLOR },
  // Blocs à sauter.
  { x: 200, y: GROUND_TOP - 40, w: 40, h: 40, color: BLOCK_COLOR },
  { x: 330, y: GROUND_TOP - 80, w: 50, h: 80, color: BLOCK_COLOR },
]

const PLAYER_SPAWN = { x: 100, y: 440 }
const ENEMY_START = { x: 800, y: GROUND_TOP - 20 }

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player
  private enemy!: Enemy

  constructor() {
    super('GameScene')
  }

  create() {
    // Pas de bord en bas : le joueur doit pouvoir tomber dans le trou.
    this.physics.world.setBoundsCollision(true, true, true, false)

    const solids = LEVEL.map(({ x, y, w, h, color }) => {
      const rect = this.add.rectangle(x + w / 2, y + h / 2, w, h, color)
      this.physics.add.existing(rect, true)
      return rect
    })

    this.player = new Player(this, PLAYER_SPAWN.x, PLAYER_SPAWN.y)
    this.enemy = new Enemy(this, ENEMY_START.x, ENEMY_START.y)

    this.physics.add.collider(this.player, solids)
    this.physics.add.overlap(this.player, this.enemy, () => this.player.respawn())

    this.inputController = new InputController(this)
  }

  update() {
    this.inputController.update()
    this.player.update(this.inputController)
    this.enemy.update()

    if (this.player.y > this.scale.height + 100) {
      this.player.respawn()
    }
  }
}
