import { ANIMS, CHARS, TILE_SIZE } from '../art/kenneyTiles'
import { FLYER_SPEED, FLYER_WAVE_MS } from '../config'
import { Enemy, type EnemyLook } from './Enemy'

// Chauve-souris : hitbox = le corps, sans le bout des ailes.
const BAT: EnemyLook = {
  frame: CHARS.batUp,
  anim: ANIMS.flyerFlap,
  hitbox: { width: 12, height: 10, offsetX: 6, offsetY: 8 },
  speed: FLYER_SPEED,
}

/** Ennemi volant : patrouille horizontale et vague verticale autour de sa hauteur de départ ; y = bas de l'image. */
export class FlyingEnemy extends Enemy {
  private readonly baseY: number
  private readonly amplitude: number

  /** `amplitude` : hauteur de la vague, de part et d'autre de la hauteur de départ (px). */
  constructor(scene: Phaser.Scene, x: number, y: number, patrolDistance = 6 * TILE_SIZE, amplitude = TILE_SIZE) {
    super(scene, x, y, patrolDistance, BAT)
    this.baseY = y
    this.amplitude = amplitude
  }

  update(time: number) {
    super.update()
    // Vitesse verticale qui rejoint la vague au prochain pas de la physique (pas fixe, ex. 1/60 s),
    // indépendamment de la fréquence d'affichage de l'écran.
    const step = 1 / this.scene.physics.world.fps
    const target = this.baseY + this.amplitude * Math.sin((2 * Math.PI * (time + step * 1000)) / FLYER_WAVE_MS)
    this.body.setVelocityY((target - this.y) / step)
  }
}
