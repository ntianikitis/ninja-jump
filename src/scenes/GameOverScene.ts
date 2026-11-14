import * as Phaser from 'phaser'
import { ART_SCALE } from '../art/palette'
import { TEX } from '../art/pixelTextures'
import { PixelButton } from '../ui/PixelButton'
import { PixelPanel } from '../ui/PixelPanel'
import { UI_TEXT_STYLE } from '../ui/textStyle'

export type GameOverData = { stars: number }

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
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2
    this.ready = false

    this.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0)
    new PixelPanel(this, cx, cy, 520, 340)

    this.add.text(cx, cy - 115, 'Oups !', { ...UI_TEXT_STYLE, fontSize: '64px', color: '#ffd23f', strokeThickness: 8 }).setOrigin(0.5)
    this.add.text(cx, cy - 55, Phaser.Utils.Array.GetRandom(MESSAGES), { ...UI_TEXT_STYLE, fontSize: '26px' }).setOrigin(0.5)

    const scoreText =
      data.stars === 0
        ? 'Les étoiles t’attendent !'
        : `${data.stars} étoile${data.stars > 1 ? 's' : ''} ramassée${data.stars > 1 ? 's' : ''}`
    const score = this.add.text(cx + 14, cy, scoreText, { ...UI_TEXT_STYLE, fontSize: '26px', color: '#fff6b0' }).setOrigin(0.5)
    this.add.image(score.x - score.width / 2 - 20, cy, TEX.star).setScale(ART_SCALE)

    const button = new PixelButton(this, cx, cy + 95, 'Recommencer', () => this.restart())
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
    this.scene.stop()
    this.scene.get('GameScene').scene.restart()
  }
}
