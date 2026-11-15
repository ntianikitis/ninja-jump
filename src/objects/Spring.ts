import * as Phaser from 'phaser'
import { KENNEY, TILES } from '../art/kenneyTiles'

const COMPRESSED_MS = 150

/** Ressort du pack, posé par ses pieds en (x, y) ; solide seulement par le dessus. */
export class Spring extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody

  /** Multiplicateur de la vitesse d'éjection (propriété Tiled `power`). */
  readonly power: number

  constructor(scene: Phaser.Scene, x: number, y: number, power = 1) {
    super(scene, x, y, KENNEY.tiles, TILES.springUp)
    this.power = power
    this.setOrigin(0.5, 1)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    // Hitbox : le plateau rouge et le pied, sur la largeur du ressort.
    this.body.setSize(14, 12).setOffset(2, 6)
    this.body.checkCollision.down = false
    this.body.checkCollision.left = false
    this.body.checkCollision.right = false
  }

  /** Petite animation : comprimé un instant, puis détendu. */
  squash() {
    this.setFrame(TILES.springDown)
    this.scene.time.delayedCall(COMPRESSED_MS, () => this.setFrame(TILES.springUp))
  }
}
