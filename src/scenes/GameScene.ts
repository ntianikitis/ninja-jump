import * as Phaser from 'phaser'
import { InputController } from '../input/InputController'
import { Player } from '../objects/Player'

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player

  constructor() {
    super('GameScene')
  }

  create() {
    const { width, height } = this.scale

    // TEMP : sol provisoire en attendant un vrai niveau.
    const ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x2d6a4f)
    this.physics.add.existing(ground, true)

    this.player = new Player(this, 120, height - 100)
    this.physics.add.collider(this.player, ground)

    this.inputController = new InputController(this)
  }

  update() {
    this.inputController.update()
    this.player.update(this.inputController)
  }
}
