import * as Phaser from 'phaser'
import { createPixelTextures } from '../art/pixelTextures'
import { createPlayerAnimations, loadPlayerAssets } from '../characters/playerAssets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    loadPlayerAssets(this)
  }

  create() {
    createPixelTextures(this)
    createPlayerAnimations(this)
    this.scene.start('GameScene')
  }
}
