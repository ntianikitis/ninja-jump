import * as Phaser from 'phaser'
import { createPlayerAnimations, loadPlayerAssets } from '../characters/playerAssets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    loadPlayerAssets(this)
  }

  create() {
    createPlayerAnimations(this)
    this.scene.start('GameScene')
  }
}
