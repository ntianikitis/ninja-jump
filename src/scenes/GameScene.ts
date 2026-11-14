import * as Phaser from 'phaser'
import { ART_SCALE, PALETTE } from '../art/palette'
import { GRASS_BLADES_HEIGHT, TEX } from '../art/pixelTextures'
import { LIFE_LOST_MS, PLAYER_MAX_HEALTH, PLAYER_START_LIVES } from '../config'
import { InputController } from '../input/InputController'
import { level1 } from '../levels/level1'
import type { LevelData } from '../levels/types'
import { Enemy } from '../objects/Enemy'
import { HEALTH_CHANGED, HEALTH_DEPLETED, Player } from '../objects/Player'
import { Hud } from '../ui/Hud'
import { LivesCounter } from '../ui/LivesCounter'
import type { GameOverData } from './GameOverScene'

const GROUND_TOP = 500
const GROUND_HEIGHT = 40
const EDGE_COLOR = Phaser.Display.Color.HexStringToColor(PALETTE.outline).color
// Nuages : facteur de défilement (parallaxe), espacement et hauteurs, par couche.
const CLOUD_LAYERS = [
  { scrollFactor: 0.2, spacing: 260, minY: 30, maxY: 170, alpha: 0.85 },
  { scrollFactor: 0.4, spacing: 420, minY: 60, maxY: 220, alpha: 1 },
]
const CHECKPOINT_COLOR = 0x9e9e9e
const CHECKPOINT_ACTIVE_COLOR = 0xffd60a
// Hauteur du centre du joueur à l'apparition (il tombe un peu jusqu'au sol).
const SPAWN_Y = GROUND_TOP - 60
const RESTART_DELAY_MS = 2000
const PICKUP_DEFAULT_HEIGHT = 40
const LIVES_GAP = 12

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player
  private enemies: Enemy[] = []
  private livesCounter!: LivesCounter
  private finished = false
  private lives = PLAYER_START_LIVES
  private stars = 0
  /** Perte d'une vie en cours (animation, puis checkpoint ou écran « Oups ! »). */
  private losingLife = false

  constructor() {
    super('GameScene')
  }

  create() {
    const level = level1
    const { height } = this.scale

    // La scène est réutilisée par restart() : on remet son état à zéro.
    this.enemies = []
    this.finished = false
    this.lives = PLAYER_START_LIVES
    this.stars = 0
    this.losingLife = false

    // Pas de bord en bas : le joueur doit pouvoir tomber dans les trous.
    this.physics.world.setBounds(0, 0, level.width, height)
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.createBackground(level)
    const solids = this.createSolids(level)

    this.player = new Player(this, level.spawnX, SPAWN_Y)
    this.physics.add.collider(this.player, solids)

    for (const obj of level.objects) {
      if (obj.type === 'enemy') {
        this.enemies.push(new Enemy(this, obj.x, GROUND_TOP - 20))
      } else if (obj.type === 'checkpoint') {
        this.createCheckpoint(obj.x)
      } else if (obj.type === 'finish') {
        this.createFinish(obj.x)
      } else if (obj.type === 'heart') {
        this.createHeart(obj.x, GROUND_TOP - (obj.y ?? PICKUP_DEFAULT_HEIGHT))
      } else if (obj.type === 'star') {
        this.createStar(obj.x, GROUND_TOP - (obj.y ?? PICKUP_DEFAULT_HEIGHT))
      }
    }

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.player.hit((enemy as Enemy).x),
    )

    const healthBar = new Hud(this).addBar({ icon: TEX.heart, fullTexture: TEX.barRed, max: PLAYER_MAX_HEALTH })
    this.player.on(HEALTH_CHANGED, (health: number) => healthBar.setValue(health))
    this.player.on(HEALTH_DEPLETED, () => this.loseLife())
    this.livesCounter = new LivesCounter(this, healthBar.right + LIVES_GAP, healthBar.y, this.lives)

    this.cameras.main.setBounds(0, 0, level.width, height)
    this.cameras.main.startFollow(this.player, true, 0.1, 0)

    this.inputController = new InputController(this)
  }

  update() {
    this.inputController.update()
    for (const enemy of this.enemies) enemy.update()

    if (this.finished || this.losingLife) return

    this.player.update(this.inputController)

    // Tomber dans un trou fait perdre une vie directement.
    if (this.player.y > this.scale.height + 100) {
      this.player.freeze()
      this.loseLife()
    }
  }

  /** Ciel en dégradé fixe et deux couches de nuages en parallaxe. */
  private createBackground(level: LevelData) {
    const { width, height } = this.scale

    this.add
      .tileSprite(0, 0, width / ART_SCALE, height / ART_SCALE, TEX.sky)
      .setOrigin(0)
      .setScale(ART_SCALE)
      .setScrollFactor(0)
      .setDepth(-100)

    const maxScroll = level.width - width
    CLOUD_LAYERS.forEach((layer, i) => {
      // Une couche défile de maxScroll * scrollFactor : on la remplit sur cette largeur.
      const span = width + maxScroll * layer.scrollFactor
      let n = 0
      for (let x = 40 + i * 120; x < span; x += layer.spacing) {
        const y = layer.minY + ((n * 97 + i * 53) % (layer.maxY - layer.minY))
        const offset = ((n * 61) % 80) - 40
        this.add
          .image(Math.round(x + offset), y, TEX.clouds[(n + i) % TEX.clouds.length])
          .setScale(ART_SCALE)
          .setScrollFactor(layer.scrollFactor, 0)
          .setAlpha(layer.alpha)
          .setDepth(-90 + i)
        n++
      }
    })
  }

  /** Sol sur toute la largeur sauf aux trous, plus les blocs ; renvoie les zones de collision. */
  private createSolids(level: LevelData) {
    const solids: Phaser.GameObjects.Zone[] = []
    const addSolid = (x: number, y: number, w: number, h: number) => {
      const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
      this.physics.add.existing(zone, true)
      solids.push(zone)
      this.drawGround(x, y, w, h)
    }

    const holes = level.objects
      .filter((obj) => obj.type === 'hole')
      .sort((a, b) => a.x - b.x)

    let groundStart = 0
    for (const hole of holes) {
      if (hole.x > groundStart) {
        addSolid(groundStart, GROUND_TOP, hole.x - groundStart, GROUND_HEIGHT)
      }
      groundStart = hole.x + hole.w
    }
    if (groundStart < level.width) {
      addSolid(groundStart, GROUND_TOP, level.width - groundStart, GROUND_HEIGHT)
    }

    for (const obj of level.objects) {
      if (obj.type === 'block') {
        addSolid(obj.x, GROUND_TOP - obj.h, obj.w, obj.h)
      }
    }

    return solids
  }

  /** Terre en briques + herbe sur le dessus (brins décoratifs au-dessus de y) + bords sombres. */
  private drawGround(x: number, y: number, w: number, h: number) {
    // Motif aligné sur le monde pour que les morceaux voisins se raccordent.
    this.add
      .tileSprite(x, y, w / ART_SCALE, h / ART_SCALE, TEX.dirt)
      .setOrigin(0)
      .setScale(ART_SCALE)
      .setTilePosition(x / ART_SCALE, y / ART_SCALE)

    const grassTop = y - GRASS_BLADES_HEIGHT * ART_SCALE
    this.add
      .tileSprite(x, grassTop, w / ART_SCALE, this.textures.getFrame(TEX.grass).height, TEX.grass)
      .setOrigin(0)
      .setScale(ART_SCALE)
      .setTilePosition(x / ART_SCALE, 0)

    this.add.rectangle(x, y, ART_SCALE, h, EDGE_COLOR).setOrigin(0)
    this.add.rectangle(x + w - ART_SCALE, y, ART_SCALE, h, EDGE_COLOR).setOrigin(0)
  }

  /** −1 vie : la tête clignote, puis retour au checkpoint avec tous les cœurs, ou écran « Oups ! ». */
  private loseLife() {
    if (this.losingLife || this.finished) return
    this.losingLife = true
    this.lives--
    this.livesCounter.loseLife(LIFE_LOST_MS)

    this.time.delayedCall(LIFE_LOST_MS, () => {
      if (this.lives > 0) {
        this.losingLife = false
        this.player.respawn()
      } else {
        // La pause gèle les tweens : on masque la dernière tête avant de figer la scène.
        this.livesCounter.setLives(0)
        this.scene.pause()
        this.scene.launch('GameOverScene', { stars: this.stars } satisfies GameOverData)
      }
    })
  }

  private createCheckpoint(x: number) {
    const pole = this.add.rectangle(x, GROUND_TOP - 45, 10, 90, CHECKPOINT_COLOR)
    this.physics.add.existing(pole, true)

    let active = false
    this.physics.add.overlap(this.player, pole, () => {
      if (active) return
      active = true
      pole.setFillStyle(CHECKPOINT_ACTIVE_COLOR)
      this.player.setSpawn(x, SPAWN_Y)
    })
  }

  /** Cœur à ramasser : +1 vie ; il reste en place si la vie est pleine. */
  private createHeart(x: number, y: number) {
    const heart = this.add.image(x, y, TEX.heartBig).setScale(ART_SCALE)
    this.physics.add.existing(heart, true)
    this.tweens.add({ targets: heart, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    this.physics.add.overlap(this.player, heart, () => {
      if (!heart.active || !this.player.heal()) return
      this.tweens.killTweensOf(heart)
      heart.destroy()
    })
  }

  /** Étoile à collectionner : +1 au score, petit effet en disparaissant. */
  private createStar(x: number, y: number) {
    const star = this.add.image(x, y, TEX.star).setScale(ART_SCALE)
    this.physics.add.existing(star, true)
    this.tweens.add({ targets: star, y: y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    let collected = false
    this.physics.add.overlap(this.player, star, () => {
      if (collected) return
      collected = true
      this.stars++
      this.tweens.killTweensOf(star)
      this.tweens.add({
        targets: star,
        y: star.y - 30,
        alpha: 0,
        scale: ART_SCALE * 1.5,
        duration: 250,
        onComplete: () => star.destroy(),
      })
    })
  }

  private createFinish(x: number) {
    this.add.rectangle(x, GROUND_TOP - 80, 8, 160, 0xf1faee)
    this.add.rectangle(x + 29, GROUND_TOP - 143, 50, 34, 0xffb703)

    const zone = this.add.zone(x, GROUND_TOP - 80, 40, 160)
    this.physics.add.existing(zone, true)
    this.physics.add.overlap(this.player, zone, () => this.finishLevel())
  }

  private finishLevel() {
    if (this.finished) return
    this.finished = true

    this.player.celebrate()

    const { width, height } = this.scale
    const text = this.add
      .text(width / 2, height / 2, 'Bravo !', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#ffd60a',
        stroke: '#1d3557',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setScale(0.5)

    this.tweens.add({ targets: text, scale: 1, duration: 300, ease: 'Back.Out' })
    this.time.delayedCall(RESTART_DELAY_MS, () => this.scene.restart())
  }
}
