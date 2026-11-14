import * as Phaser from 'phaser'

const BUTTON_RADIUS = 19
const BUTTON_MARGIN = 8
const BUTTON_ALPHA = 0.35
const BUTTON_ALPHA_PRESSED = 0.6

/**
 * Regroupe clavier et tactile : le jeu ne lit que left / right / jumpPressed.
 * À appeler via update() une fois par image, avant de lire les valeurs.
 */
export class InputController {
  left = false
  right = false
  /** Vrai uniquement à l'image où l'appui de saut commence. */
  jumpPressed = false

  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private touchLeft = false
  private touchRight = false
  private touchJumpQueued = false

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard?.createCursorKeys()

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
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onChange: (down: boolean) => void,
  ) {
    const circle = scene.add
      .circle(x, y, BUTTON_RADIUS, 0xffffff, BUTTON_ALPHA)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive()

    scene.add
      .text(x, y, label, { fontSize: '15px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)

    const press = () => {
      circle.setFillStyle(0xffffff, BUTTON_ALPHA_PRESSED)
      onChange(true)
    }
    // Relâché aussi quand le doigt glisse hors du bouton, pour ne jamais rester bloqué.
    const release = () => {
      circle.setFillStyle(0xffffff, BUTTON_ALPHA)
      onChange(false)
    }

    circle.on('pointerdown', press)
    circle.on('pointerup', release)
    circle.on('pointerout', release)
  }
}
