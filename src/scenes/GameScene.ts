import * as Phaser from 'phaser'
import { InputController } from '../input/InputController'
import { level1 } from '../levels/level1'
import type { LevelData } from '../levels/types'
import { Enemy } from '../objects/Enemy'
import { Player } from '../objects/Player'

const GROUND_TOP = 500
const GROUND_HEIGHT = 40
const GROUND_COLOR = 0x2d6a4f
const BLOCK_COLOR = 0x8d5524
const CHECKPOINT_COLOR = 0x9e9e9e
const CHECKPOINT_ACTIVE_COLOR = 0xffd60a
// Hauteur du centre du joueur à l'apparition (il tombe un peu jusqu'au sol).
const SPAWN_Y = GROUND_TOP - 60
const RESTART_DELAY_MS = 2000

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player
  private enemies: Enemy[] = []
  private finished = false

  constructor() {
    super('GameScene')
  }

  create() {
    const level = level1
    const { height } = this.scale

    // La scène est réutilisée par restart() : on remet son état à zéro.
    this.enemies = []
    this.finished = false

    // Pas de bord en bas : le joueur doit pouvoir tomber dans les trous.
    this.physics.world.setBounds(0, 0, level.width, height)
    this.physics.world.setBoundsCollision(true, true, true, false)

    const solids = this.createSolids(level)

    this.player = new Player(this, level.spawnX, SPAWN_Y)
    this.physics.add.collider(this.player, solids)

    for (const obj of level.objects) {
      if (obj.type === 'enemy') {
        this.enemies.push(new Enemy(this, obj.x, GROUND_TOP - 20))
      } else if (obj.type === 'checkpoint') {
        this.createCheckpoint(obj.x)
      } else if (obj.type === 'finish') {
        this.createFinish(obj.x)
      }
    }

    this.physics.add.overlap(this.player, this.enemies, () => this.player.respawn())

    this.cameras.main.setBounds(0, 0, level.width, height)
    this.cameras.main.startFollow(this.player, true, 0.1, 0)

    this.inputController = new InputController(this)
  }

  update() {
    this.inputController.update()
    for (const enemy of this.enemies) enemy.update()

    if (this.finished) return

    this.player.update(this.inputController)

    if (this.player.y > this.scale.height + 100) {
      this.player.respawn()
    }
  }

  /** Sol sur toute la largeur sauf aux trous, plus les blocs. */
  private createSolids(level: LevelData) {
    const rects: Phaser.GameObjects.Rectangle[] = []
    const addRect = (x: number, y: number, w: number, h: number, color: number) => {
      const rect = this.add.rectangle(x + w / 2, y + h / 2, w, h, color)
      this.physics.add.existing(rect, true)
      rects.push(rect)
    }

    const holes = level.objects
      .filter((obj) => obj.type === 'hole')
      .sort((a, b) => a.x - b.x)

    let groundStart = 0
    for (const hole of holes) {
      if (hole.x > groundStart) {
        addRect(groundStart, GROUND_TOP, hole.x - groundStart, GROUND_HEIGHT, GROUND_COLOR)
      }
      groundStart = hole.x + hole.w
    }
    if (groundStart < level.width) {
      addRect(groundStart, GROUND_TOP, level.width - groundStart, GROUND_HEIGHT, GROUND_COLOR)
    }

    for (const obj of level.objects) {
      if (obj.type === 'block') {
        addRect(obj.x, GROUND_TOP - obj.h, obj.w, obj.h, BLOCK_COLOR)
      }
    }

    return rects
  }

  private createCheckpoint(x: number) {
    const pole = this.add.rectangle(x, GROUND_TOP - 45, 10, 90, CHECKPOINT_COLOR)
    this.physics.add.existing(pole, true)

    let active = false
    this.physics.add.overlap(this.player, pole, () => {
      if (active) return
      active = true
      pole.setFillStyle(CHECKPOINT_ACTIVE_COLOR)
      this.player.setSpawn(x, SPAWN_Y)
    })
  }

  private createFinish(x: number) {
    this.add.rectangle(x, GROUND_TOP - 80, 8, 160, 0xf1faee)
    this.add.rectangle(x + 29, GROUND_TOP - 143, 50, 34, 0xffb703)

    const zone = this.add.zone(x, GROUND_TOP - 80, 40, 160)
    this.physics.add.existing(zone, true)
    this.physics.add.overlap(this.player, zone, () => this.finishLevel())
  }

  private finishLevel() {
    if (this.finished) return
    this.finished = true

    this.player.body.setVelocity(0, 0)
    this.player.body.moves = false

    const { width, height } = this.scale
    const text = this.add
      .text(width / 2, height / 2, 'Bravo !', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#ffd60a',
        stroke: '#1d3557',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setScale(0.5)

    this.tweens.add({ targets: text, scale: 1, duration: 300, ease: 'Back.Out' })
    this.time.delayedCall(RESTART_DELAY_MS, () => this.scene.restart())
  }
}
