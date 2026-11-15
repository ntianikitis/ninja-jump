import * as Phaser from 'phaser'
import { ANIMS, KENNEY, SKY_COLOR, TILE_SIZE, TILES } from '../art/kenneyTiles'
import { getCharacterManifest, PLAYER_TEXTURE, playerAnimKey } from '../characters/playerAssets'
import { setupWorldCamera, VIEW_HEIGHT, VIEW_WIDTH } from '../display'
import { PixelButton } from '../ui/PixelButton'
import { UI_TEXT_STYLE } from '../ui/textStyle'

const GROUND_TOP = 8 * TILE_SIZE

/** Écran de démarrage : titre, ninja animé, bouton « Jouer » (souris, toucher, Entrée ou Espace). */
export class StartScene extends Phaser.Scene {
  private starting = false

  constructor() {
    super('StartScene')
  }

  create() {
    // Même zoom que le jeu, caméra centrée sur la vue 320x180.
    setupWorldCamera(this)
    this.cameras.main.centerOn(VIEW_WIDTH / 2, VIEW_HEIGHT / 2).setBackgroundColor(SKY_COLOR)
    this.starting = false
    const cx = VIEW_WIDTH / 2

    // Décor : horizon, sol en tuiles du pack, une pièce qui tourne, le ninja au repos.
    this.add.tileSprite(0, GROUND_TOP - 40, VIEW_WIDTH, 48, 'horizon-day').setOrigin(0)
    this.add.tileSprite(0, GROUND_TOP, VIEW_WIDTH, TILE_SIZE, KENNEY.tiles, TILES.grassMid).setOrigin(0)
    this.add.tileSprite(0, GROUND_TOP + TILE_SIZE, VIEW_WIDTH, TILE_SIZE, KENNEY.tiles, TILES.dirtMid).setOrigin(0)
    this.add.sprite(250, GROUND_TOP - TILE_SIZE / 2, KENNEY.tiles, TILES.coin).play(ANIMS.coinSpin)
    this.add
      .sprite(70, GROUND_TOP, PLAYER_TEXTURE)
      .setOrigin(0.5, 1)
      .setScale(getCharacterManifest(this).scale)
      .play(playerAnimKey('idle'))

    const title = this.add
      .text(cx, 40, 'Ninja Jump', { ...UI_TEXT_STYLE, fontSize: '30px', color: '#ffd23f', strokeThickness: 4 })
      .setOrigin(0.5)
    this.tweens.add({ targets: title, y: 37, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    new PixelButton(this, cx, 88, 'Jouer', () => this.start())

    const hint = this.sys.game.device.input.touch
      ? 'Boutons à l’écran : ◀ ▶ courir, ▲ sauter, shuriken pour lancer'
      : '← → courir   Espace sauter   X lancer un shuriken'
    // Sur la terre brune (en bas), où le texte blanc ressort mieux que sur les nuages.
    this.add.text(cx, GROUND_TOP + TILE_SIZE + 2, hint, { ...UI_TEXT_STYLE, fontSize: '9px' }).setOrigin(0.5)

    const keyboard = this.input.keyboard
    keyboard?.on('keydown-ENTER', () => this.start())
    keyboard?.on('keydown-SPACE', () => this.start())
  }

  private start() {
    if (this.starting) return
    this.starting = true
    this.cameras.main.fadeOut(250, 223, 246, 245)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'))
  }
}
