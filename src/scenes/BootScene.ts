import * as Phaser from 'phaser'
import { BG_TILE_SIZE, CHAR_SIZE, createKenneyAnimations, KENNEY, TILE_SIZE } from '../art/kenneyTiles'
import { createPixelTextures } from '../art/pixelTextures'
import { createPlayerAnimations, loadPlayerAssets } from '../characters/playerAssets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    loadPlayerAssets(this)
    // Planches « packed » (sans espace entre les tuiles).
    this.load.spritesheet(KENNEY.tiles, 'assets/kenney/tiles.png', { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE })
    this.load.spritesheet(KENNEY.backgrounds, 'assets/kenney/backgrounds.png', {
      frameWidth: BG_TILE_SIZE,
      frameHeight: BG_TILE_SIZE,
    })
    this.load.spritesheet(KENNEY.characters, 'assets/kenney/characters.png', { frameWidth: CHAR_SIZE, frameHeight: CHAR_SIZE })
  }

  create() {
    createPixelTextures(this)
    createKenneyAnimations(this)
    createPlayerAnimations(this)
    this.scene.start('GameScene')
  }
}
