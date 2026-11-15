import * as Phaser from 'phaser'
import { KENNEY, TILES } from '../art/kenneyTiles'
import { playJingle } from '../audio/audio'
import { setupWorldCamera, VIEW_HEIGHT, VIEW_WIDTH } from '../display'
import { PixelButton } from '../ui/PixelButton'
import { PixelPanel } from '../ui/PixelPanel'
import { UI_TEXT_STYLE } from '../ui/textStyle'

export type GameOverData = { coins: number }

const MESSAGES = ['Pas grave, on réessaie !', 'Tu y étais presque !', 'Le ninja est prêt à repartir !']
// Les commandes ne répondent qu'après ce délai (évite un Espace de saut encore en cours).
const INPUT_DELAY_MS = 600

/** Plus de vies : écran bienveillant par-dessus le jeu en pause, avec un bouton « Recommencer ». */
export class GameOverScene extends Phaser.Scene {
  private ready = false

  constructor() {
    super('GameOverScene')
  }

  create(data: GameOverData) {
    // Même zoom que le jeu, caméra centrée sur la vue 320x180 : les coordonnées ci-dessous restent celles de la vue.
    setupWorldCamera(this)
    this.cameras.main.centerOn(VIEW_WIDTH / 2, VIEW_HEIGHT / 2)
    const width = VIEW_WIDTH
    const height = VIEW_HEIGHT
    const cx = width / 2
    const cy = height / 2
    this.ready = false

    this.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0)
    new PixelPanel(this, cx, cy, 180, 116)

    this.add.text(cx, cy - 38, 'Oups !', { ...UI_TEXT_STYLE, fontSize: '22px', color: '#ffd23f', strokeThickness: 3 }).setOrigin(0.5)
    this.add.text(cx, cy - 16, Phaser.Utils.Array.GetRandom(MESSAGES), { ...UI_TEXT_STYLE, fontSize: '10px' }).setOrigin(0.5)

    const scoreText =
      data.coins === 0
        ? 'Les pièces t’attendent !'
        : `${data.coins} pièce${data.coins > 1 ? 's' : ''} ramassée${data.coins > 1 ? 's' : ''}`
    const score = this.add.text(cx + 5, cy + 2, scoreText, { ...UI_TEXT_STYLE, fontSize: '10px', color: '#fff6b0' }).setOrigin(0.5)
    this.add.image(score.x - score.width / 2 - 9, cy + 2, KENNEY.tiles, TILES.coin)

    const button = new PixelButton(this, cx, cy + 32, 'Recommencer', () => this.restart())
    button.setAlpha(0.6)

    this.time.delayedCall(INPUT_DELAY_MS, () => {
      this.ready = true
      button.setAlpha(1)
    })

    const keyboard = this.input.keyboard
    keyboard?.on('keydown-ENTER', () => this.restart())
    keyboard?.on('keydown-SPACE', () => this.restart())
  }

  private restart() {
    if (!this.ready) return
    this.ready = false
    playJingle(this, 'restart')
    this.scene.stop()
    this.scene.get('GameScene').scene.restart()
  }
}
