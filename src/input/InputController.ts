import * as Phaser from 'phaser'
import { TEX } from '../art/pixelTextures'

const BUTTON_RADIUS = 19
const BUTTON_MARGIN = 8
const BUTTON_ALPHA = 0.35
const BUTTON_ALPHA_PRESSED = 0.6
const BUTTON_ALPHA_DISABLED = 0.15

type TouchButton = { circle: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text | Phaser.GameObjects.Image }

/**
 * Regroupe clavier et tactile : le jeu ne lit que left / right / jumpPressed / throwPressed.
 * À appeler via update() une fois par image, avant de lire les valeurs.
 */
export class InputController {
  left = false
  right = false
  /** Vrai uniquement à l'image où l'appui de saut commence. */
  jumpPressed = false
  /** Vrai uniquement à l'image où l'appui de lancer commence (X, F ou bouton shuriken). */
  throwPressed = false

  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly throwKeys: Phaser.Input.Keyboard.Key[] = []
  private throwButton?: TouchButton
  private touchLeft = false
  private touchRight = false
  private touchJumpQueued = false
  private touchThrowQueued = false

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard
    this.cursors = keyboard?.createCursorKeys()
    if (keyboard) {
      const { X, F } = Phaser.Input.Keyboard.KeyCodes
      this.throwKeys.push(keyboard.addKey(X), keyboard.addKey(F))
    }

    if (scene.sys.game.device.input.touch) {
      this.createTouchButtons(scene)
    }
  }

  update() {
    const cursors = this.cursors
    // Les deux JustDown sont évalués séparément pour consommer chaque appui.
    const spaceJust = cursors ? Phaser.Input.Keyboard.JustDown(cursors.space) : false
    const upJust = cursors ? Phaser.Input.Keyboard.JustDown(cursors.up) : false

    this.left = this.touchLeft || (cursors?.left.isDown ?? false)
    this.right = this.touchRight || (cursors?.right.isDown ?? false)
    this.jumpPressed = this.touchJumpQueued || spaceJust || upJust
    this.touchJumpQueued = false

    const throwJust = this.throwKeys.map((key) => Phaser.Input.Keyboard.JustDown(key)).some(Boolean)
    this.throwPressed = this.touchThrowQueued || throwJust
    this.touchThrowQueued = false
  }

  /** Grise le bouton shuriken tactile quand il n'y a plus de munitions (il reste appuyable). */
  setThrowEnabled(enabled: boolean) {
    if (!this.throwButton) return
    this.throwButton.circle.setFillStyle(0xffffff, enabled ? BUTTON_ALPHA : BUTTON_ALPHA_DISABLED)
    this.throwButton.circle.setData('alpha', enabled ? BUTTON_ALPHA : BUTTON_ALPHA_DISABLED)
    this.throwButton.label.setAlpha(enabled ? 1 : 0.35)
  }

  private createTouchButtons(scene: Phaser.Scene) {
    // Permet de courir et sauter en même temps (plusieurs doigts).
    scene.input.addPointer(2)

    const { width, height } = scene.scale
    const y = height - BUTTON_RADIUS - BUTTON_MARGIN

    this.createButton(scene, BUTTON_RADIUS + BUTTON_MARGIN, y, '◀', (down) => {
      this.touchLeft = down
    })
    this.createButton(scene, BUTTON_RADIUS * 3 + BUTTON_MARGIN * 2, y, '▶', (down) => {
      this.touchRight = down
    })
    this.createButton(scene, width - BUTTON_RADIUS - BUTTON_MARGIN, y, '▲', (down) => {
      if (down) this.touchJumpQueued = true
    })
    // Bouton shuriken, à gauche du saut.
    this.throwButton = this.createButton(scene, width - BUTTON_RADIUS * 3 - BUTTON_MARGIN * 2, y, TEX.shuriken, (down) => {
      if (down) this.touchThrowQueued = true
    })
  }

  /** Bouton rond ; `label` est un caractère, ou une clé de texture pour afficher une icône. */
  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onChange: (down: boolean) => void,
  ): TouchButton {
    const circle = scene.add
      .circle(x, y, BUTTON_RADIUS, 0xffffff, BUTTON_ALPHA)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive()
      .setData('alpha', BUTTON_ALPHA)

    const text = scene.textures.exists(label)
      ? scene.add.image(x, y, label)
      : scene.add.text(x, y, label, { fontSize: '15px', color: '#ffffff' }).setOrigin(0.5)
    text.setScrollFactor(0).setDepth(1001)

    const press = () => {
      circle.setFillStyle(0xffffff, BUTTON_ALPHA_PRESSED)
      onChange(true)
    }
    // Relâché aussi quand le doigt glisse hors du bouton, pour ne jamais rester bloqué.
    const release = () => {
      circle.setFillStyle(0xffffff, circle.getData('alpha'))
      onChange(false)
    }

    circle.on('pointerdown', press)
    circle.on('pointerup', release)
    circle.on('pointerout', release)
    return { circle, label: text }
  }
}
