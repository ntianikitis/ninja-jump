import * as Phaser from 'phaser'
import { ART_SCALE } from '../art/palette'
import { BG, BG_TILE_SIZE, KENNEY, TILE_SIZE, TILES } from '../art/kenneyTiles'
import { TEX } from '../art/pixelTextures'
import { LIFE_LOST_MS, PLAYER_MAX_HEALTH, PLAYER_START_LIVES } from '../config'
import { InputController } from '../input/InputController'
import { level1 } from '../levels/level1'
import type { LevelData } from '../levels/types'
import { Enemy } from '../objects/Enemy'
import { HEALTH_CHANGED, HEALTH_DEPLETED, Player } from '../objects/Player'
import { Hud } from '../ui/Hud'
import { LivesCounter } from '../ui/LivesCounter'
import type { GameOverData } from './GameOverScene'

// Le sol occupe les 2 dernières rangées de tuiles sur 10 (écran de 180 px).
const ROWS = 10
const GROUND_ROW = 8
const GROUND_TOP = GROUND_ROW * TILE_SIZE
const CHECKPOINT_COLOR = 0x9e9e9e
const CHECKPOINT_ACTIVE_COLOR = 0xffd60a
// Hauteur du centre du joueur à l'apparition (il tombe un peu jusqu'au sol).
const SPAWN_Y = GROUND_TOP - 20
const RESTART_DELAY_MS = 2000
const LIVES_GAP = 4
// Parallaxe de l'horizon (nuages et arbres du pack).
const HORIZON_SCROLL = 0.3
const HORIZON_TEXTURE = 'bg-horizon'

/** Centre d'une colonne de tuiles, en pixels. */
const colCenter = (col: number) => col * TILE_SIZE + TILE_SIZE / 2
/** Centre d'un objet posé `row` rangées au-dessus du sol (1 = juste au-dessus). */
const rowCenter = (row: number) => GROUND_TOP - (row - 0.5) * TILE_SIZE

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
    const levelWidth = level.width * TILE_SIZE
    const { height } = this.scale

    // La scène est réutilisée par restart() : on remet son état à zéro.
    this.enemies = []
    this.finished = false
    this.lives = PLAYER_START_LIVES
    this.stars = 0
    this.losingLife = false

    // Pas de bord en bas : le joueur doit pouvoir tomber dans les trous.
    this.physics.world.setBounds(0, 0, levelWidth, height)
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.createBackground(levelWidth)
    const solids = this.createTerrain(level)

    this.player = new Player(this, colCenter(level.spawnX), SPAWN_Y)
    this.physics.add.collider(this.player, solids)

    for (const obj of level.objects) {
      if (obj.type === 'enemy') {
        this.enemies.push(new Enemy(this, colCenter(obj.x), GROUND_TOP - 7))
      } else if (obj.type === 'checkpoint') {
        this.createCheckpoint(colCenter(obj.x))
      } else if (obj.type === 'finish') {
        this.createFinish(colCenter(obj.x))
      } else if (obj.type === 'heart') {
        this.createHeart(colCenter(obj.x), rowCenter(obj.y ?? 1))
      } else if (obj.type === 'star') {
        this.createStar(colCenter(obj.x), rowCenter(obj.y ?? 1))
      }
    }

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.player.hit((enemy as Enemy).x),
    )

    const healthBar = new Hud(this).addBar({ icon: TEX.heart, fullTexture: TEX.barRed, max: PLAYER_MAX_HEALTH })
    this.player.on(HEALTH_CHANGED, (health: number) => healthBar.setValue(health))
    this.player.on(HEALTH_DEPLETED, () => this.loseLife())
    this.livesCounter = new LivesCounter(this, healthBar.right + LIVES_GAP, healthBar.y, this.lives)

    this.cameras.main.setBounds(0, 0, levelWidth, height)
    this.cameras.main.startFollow(this.player, true, 0.1, 0)

    this.inputController = new InputController(this)
  }

  update() {
    this.inputController.update()
    for (const enemy of this.enemies) enemy.update()

    if (this.finished || this.losingLife) return

    this.player.update(this.inputController)

    // Tomber dans un trou fait perdre une vie directement.
    if (this.player.y > this.scale.height + 34) {
      this.player.freeze()
      this.loseLife()
    }
  }

  /** Ciel uni (couleur de fond du jeu) et horizon du pack en parallaxe. */
  private createBackground(levelWidth: number) {
    const { width } = this.scale
    const maxScroll = levelWidth - width

    // Bande d'horizon : colonnes « jour » de backgrounds.png, lignes horizon + bas, recollées.
    if (!this.textures.exists(HORIZON_TEXTURE)) {
      const w = BG.dayColumns * BG_TILE_SIZE
      const h = 2 * BG_TILE_SIZE
      const strip = this.textures.createCanvas(HORIZON_TEXTURE, w, h)!
      const source = this.textures.get(KENNEY.backgrounds).getSourceImage() as HTMLImageElement
      strip.context.drawImage(source, 0, BG.horizonRow * BG_TILE_SIZE, w, h, 0, 0, w, h)
      strip.refresh()
    }
    // Une couche qui défile à `factor` parcourt maxScroll × factor : on la remplit sur cette largeur.
    this.add
      .tileSprite(0, GROUND_TOP - 40, width + maxScroll * HORIZON_SCROLL, 2 * BG_TILE_SIZE, HORIZON_TEXTURE)
      .setOrigin(0)
      .setScrollFactor(HORIZON_SCROLL, 0)
      .setDepth(-90)
  }

  /** Sol (sauf aux trous) et blocs en tuiles du pack ; renvoie les zones de collision. */
  private createTerrain(level: LevelData) {
    const map = this.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width: level.width, height: ROWS })
    const tileset = map.addTilesetImage(KENNEY.tiles, KENNEY.tiles, TILE_SIZE, TILE_SIZE, 0, 0)!
    const layer = map.createBlankLayer('terrain', tileset)!

    const solids: Phaser.GameObjects.Zone[] = []
    /**
     * Rectangle de terrain : herbe en haut, terre en dessous. Bords gauche/droit visibles ou non ;
     * `closedBottom` = contour en bas (blocs), sinon la terre continue sous l'écran (sol).
     */
    const addTerrain = (col: number, row: number, w: number, h: number, edges: { left: boolean; right: boolean; closedBottom: boolean }) => {
      const T = TILES
      for (let c = col; c < col + w; c++) {
        const left = edges.left && c === col
        const right = edges.right && c === col + w - 1
        const pick = (single: number, l: number, mid: number, r: number) =>
          left && right ? single : left ? l : right ? r : mid

        for (let r = row; r < row + h; r++) {
          const top = r === row
          const bottom = edges.closedBottom && r === row + h - 1
          const tile =
            top && bottom ? pick(T.slabSingle, T.slabLeft, T.slabMid, T.slabRight)
            : top ? pick(T.grassSingle, T.grassLeft, T.grassMid, T.grassRight)
            : bottom ? pick(T.dirtBottomSingle, T.dirtBottomLeft, T.dirtBottomMid, T.dirtBottomRight)
            : pick(T.dirtSingle, T.dirtLeft, T.dirtMid, T.dirtRight)
          layer.putTileAt(tile, c, r)
        }
      }
      const zone = this.add.zone((col + w / 2) * TILE_SIZE, (row + h / 2) * TILE_SIZE, w * TILE_SIZE, h * TILE_SIZE)
      this.physics.add.existing(zone, true)
      solids.push(zone)
    }

    // Sol : un morceau entre chaque trou ; bords visibles seulement au bord des trous.
    const holes = level.objects
      .filter((obj) => obj.type === 'hole')
      .sort((a, b) => a.x - b.x)
    const groundHeight = ROWS - GROUND_ROW
    let start = 0
    for (const hole of holes) {
      if (hole.x > start) {
        addTerrain(start, GROUND_ROW, hole.x - start, groundHeight, { left: start > 0, right: true, closedBottom: false })
      }
      start = hole.x + hole.w
    }
    if (start < level.width) {
      addTerrain(start, GROUND_ROW, level.width - start, groundHeight, { left: start > 0, right: false, closedBottom: false })
    }

    // Blocs : piliers posés sur le sol.
    for (const obj of level.objects) {
      if (obj.type === 'block') {
        addTerrain(obj.x, GROUND_ROW - obj.h, obj.w, obj.h, { left: true, right: true, closedBottom: true })
      }
    }

    return solids
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
    const pole = this.add.rectangle(x, GROUND_TOP - 15, 4, 30, CHECKPOINT_COLOR)
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
    this.tweens.add({ targets: heart, y: y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

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
    this.tweens.add({ targets: star, y: y - 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    let collected = false
    this.physics.add.overlap(this.player, star, () => {
      if (collected) return
      collected = true
      this.stars++
      this.tweens.killTweensOf(star)
      this.tweens.add({
        targets: star,
        y: star.y - 10,
        alpha: 0,
        scale: ART_SCALE * 1.5,
        duration: 250,
        onComplete: () => star.destroy(),
      })
    })
  }

  private createFinish(x: number) {
    this.add.rectangle(x, GROUND_TOP - 27, 3, 54, 0xf1faee)
    this.add.rectangle(x + 10, GROUND_TOP - 48, 17, 11, 0xffb703)

    const zone = this.add.zone(x, GROUND_TOP - 27, 14, 54)
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
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffd60a',
        stroke: '#1d3557',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setScale(0.5)

    this.tweens.add({ targets: text, scale: 1, duration: 300, ease: 'Back.Out' })
    this.time.delayedCall(RESTART_DELAY_MS, () => this.scene.restart())
  }
}
