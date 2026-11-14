import './style.css'
import * as Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { DEBUG_PHYSICS, GRAVITY } from './config'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#87ceeb',
  // Pixels nets : pas de lissage, positions arrondies au pixel.
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: DEBUG_PHYSICS,
    },
  },
  scene: [BootScene, GameScene],
}

new Phaser.Game(config)
