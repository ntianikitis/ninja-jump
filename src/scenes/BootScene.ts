import * as Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // Les assets du jeu seront chargés ici.
  }

  create() {
    this.scene.start('GameScene')
  }
}
