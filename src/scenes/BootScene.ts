import * as Phaser from 'phaser'
import { CHAR_SIZE, createKenneyAnimations, KENNEY, TILE_SIZE } from '../art/kenneyTiles'
import { createPixelTextures } from '../art/pixelTextures'
import { loadAudio, restoreMute } from '../audio/audio'
import { createPlayerAnimations, loadPlayerAssets } from '../characters/playerAssets'
import { imageKey, LEVEL_KEY, LEVEL_URL } from '../levels/tiledLevel'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    loadPlayerAssets(this)
    // Planches « packed » (sans espace entre les tuiles).
    this.load.spritesheet(KENNEY.tiles, 'assets/kenney/tiles.png', { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE })
    this.load.spritesheet(KENNEY.characters, 'assets/kenney/characters.png', { frameWidth: CHAR_SIZE, frameHeight: CHAR_SIZE })

    // Niveau Tiled, et images de ses calques image (clé = nom du fichier sans extension).
    loadAudio(this)
    this.load.tilemapTiledJSON(LEVEL_KEY, LEVEL_URL)
    const horizon = 'assets/kenney/horizon-day.png'
    this.load.image(imageKey(horizon), horizon)
  }

  create() {
    createPixelTextures(this)
    restoreMute(this.game)
    createKenneyAnimations(this)
    createPlayerAnimations(this)
    this.scene.start('StartScene')
  }
}
