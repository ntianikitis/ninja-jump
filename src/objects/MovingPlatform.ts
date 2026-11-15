import * as Phaser from 'phaser'
import { KENNEY, TILES } from '../art/kenneyTiles'
import { PLATFORM_SPEED } from '../config'

// Épaisseur solide de la planche, en haut de la tuile.
const PLANK_THICKNESS = 8

export type PlatformOptions = {
  /** `x` = va vers la droite puis revient ; `y` = monte puis redescend. */
  axis: 'x' | 'y'
  /** Distance parcourue avant de revenir (px). */
  distance: number
  /** Vitesse moyenne (px/s). */
  speed?: number
}

/**
 * Plateforme mobile faite de planches, qu'on traverse par-dessous et qui emporte le joueur posé dessus.
 * (x, y) = coin haut-gauche, comme le rectangle dans Tiled.
 */
export class MovingPlatform extends Phaser.GameObjects.TileSprite {
  declare body: Phaser.Physics.Arcade.Body

  private readonly startX: number
  private readonly startY: number
  private readonly options: PlatformOptions
  /** Durée d'un aller-retour (ms). */
  private readonly period: number

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, options: PlatformOptions) {
    super(scene, x, y, width, 18, KENNEY.tiles, TILES.plank)
    this.setOrigin(0)
    this.startX = x
    this.startY = y
    this.options = options
    this.period = ((2 * options.distance) / (options.speed ?? PLATFORM_SPEED)) * 1000

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(width, PLANK_THICKNESS, false)
    this.body.setAllowGravity(false)
    this.body.setImmovable(true)
    // Position pilotée à la main : Arcade en déduit le déplacement pour emporter le joueur posé dessus.
    this.body.setDirectControl(true)
    // Solide seulement par le dessus : on saute à travers depuis le bas, et on ne se fait jamais écraser.
    this.body.checkCollision.down = false
    this.body.checkCollision.left = false
    this.body.checkCollision.right = false
  }

  update(time: number) {
    // Aller-retour qui ralentit aux extrémités.
    const progress = (1 - Math.cos((2 * Math.PI * time) / this.period)) / 2
    const offset = Math.round(progress * this.options.distance)
    if (this.options.axis === 'x') this.x = this.startX + offset
    else this.y = this.startY - offset
  }
}
