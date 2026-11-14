import './style.css'
import * as Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameOverScene } from './scenes/GameOverScene'
import { GameScene } from './scenes/GameScene'
import { SKY_COLOR } from './art/kenneyTiles'
import { DEBUG_PHYSICS, GRAVITY } from './config'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  // Résolution de base, agrandie par un facteur entier (×2 sur téléphone, ×3 à ×6 sur ordinateur).
  width: 320,
  height: 180,
  backgroundColor: SKY_COLOR,
  // Pixels nets : pas de lissage, positions arrondies au pixel.
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: Phaser.Scale.MAX_ZOOM,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: DEBUG_PHYSICS,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
}

const game = new Phaser.Game(config)

// Recalcule le plus grand facteur entier qui tient dans la fenêtre à chaque redimensionnement.
window.addEventListener('resize', () => {
  game.scale.getParentBounds()
  game.scale.setMaxZoom()
})
