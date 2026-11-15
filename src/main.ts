import './style.css'
import * as Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameOverScene } from './scenes/GameOverScene'
import { GameScene } from './scenes/GameScene'
import { StartScene } from './scenes/StartScene'
import { SKY_COLOR } from './art/kenneyTiles'
import { DEBUG_PHYSICS, GRAVITY } from './config'
import { fitToWindow, VIEW_HEIGHT, VIEW_WIDTH, WORLD_ZOOM } from './display'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  // Canvas de 640x360 (monde de 320x180 zoomé ×2), agrandi par un facteur entier selon l'écran.
  width: VIEW_WIDTH * WORLD_ZOOM,
  height: VIEW_HEIGHT * WORLD_ZOOM,
  backgroundColor: SKY_COLOR,
  // Pixels nets : pas de lissage, positions arrondies au pixel.
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: DEBUG_PHYSICS,
    },
  },
  scene: [BootScene, StartScene, GameScene, GameOverScene],
}

const game = new Phaser.Game(config)

// Facteur d'agrandissement recalculé au démarrage et à chaque redimensionnement de la fenêtre.
game.events.once(Phaser.Core.Events.READY, () => fitToWindow(game))
window.addEventListener('resize', () => fitToWindow(game))
