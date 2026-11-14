import * as Phaser from 'phaser'
import { ANIMS, BG, BG_TILE_SIZE, KENNEY, TILE_SIZE, TILES } from '../art/kenneyTiles'
import { TEX } from '../art/pixelTextures'
import { Sfx } from '../audio/sfx'
import {
  LIFE_LOST_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_START_LIVES,
  SHURIKEN_COOLDOWN_MS,
  SHURIKEN_START,
} from '../config'
import { InputController } from '../input/InputController'
import { level1 } from '../levels/level1'
import type { LevelData, LevelObject } from '../levels/types'
import { Chest } from '../objects/Chest'
import { Enemy } from '../objects/Enemy'
import { HEALTH_CHANGED, HEALTH_DEPLETED, Player } from '../objects/Player'
import { Shuriken } from '../objects/Shuriken'
import { Hud } from '../ui/Hud'
import { LivesCounter } from '../ui/LivesCounter'
import type { TileCounter } from '../ui/TileCounter'
import type { GameOverData } from './GameOverScene'

// Le sol occupe les 2 dernières rangées de tuiles sur 10 (écran de 180 px).
const ROWS = 10
const GROUND_ROW = 8
const GROUND_TOP = GROUND_ROW * TILE_SIZE
// Hauteur du centre du joueur à l'apparition (il tombe un peu jusqu'au sol).
const SPAWN_Y = GROUND_TOP - 20
const RESTART_DELAY_MS = 2000
const LIVES_GAP = 4
// Les cœurs du pack (18 px, dessin d'environ 14 px) se suivent tous les 14 px.
const HEART_SPACING = 14
// Parallaxe de l'horizon (nuages et arbres du pack).
const HORIZON_SCROLL = 0.3
const HORIZON_TEXTURE = 'bg-horizon'
// Récompense d'un coffre : délai entre deux shurikens qui volent vers le compteur, durée du vol.
const REWARD_STAGGER_MS = 120
const REWARD_FLIGHT_MS = 650

/** Celui des deux objets d'un contact qui est un shuriken (l'ordre n'est pas garanti). */
const asShuriken = (a: unknown, b: unknown) => [a, b].find((obj) => obj instanceof Shuriken)

/** Centre d'une colonne de tuiles, en pixels. */
const colCenter = (col: number) => col * TILE_SIZE + TILE_SIZE / 2
/** Centre d'un objet posé `row` rangées au-dessus du sol (1 = juste au-dessus). */
const rowCenter = (row: number) => GROUND_TOP - (row - 0.5) * TILE_SIZE

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player
  private enemies: Enemy[] = []
  private shurikens!: Phaser.Physics.Arcade.Group
  private livesCounter!: LivesCounter
  private ammoCounter!: TileCounter
  private sfx!: Sfx
  private finished = false
  private lives = PLAYER_START_LIVES
  private coins = 0
  private ammo = SHURIKEN_START
  private lastThrowAt = -Infinity
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
    this.coins = 0
    this.ammo = SHURIKEN_START
    this.lastThrowAt = -Infinity
    this.losingLife = false
    this.sfx = new Sfx(this)

    // Pas de bord en bas : le joueur doit pouvoir tomber dans les trous.
    this.physics.world.setBounds(0, 0, levelWidth, height)
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.createBackground(levelWidth)
    const solids = this.createTerrain(level)

    this.player = new Player(this, colCenter(level.spawnX), SPAWN_Y)
    this.physics.add.collider(this.player, solids)

    for (const obj of level.objects) this.spawnObject(obj)

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.player.hit((enemy as Enemy).x),
    )

    // Shurikens lancés : ils s'arrêtent sur les blocs et le sol, et battent les ennemis.
    // Attention : pour un groupe testé contre une liste, Phaser passe les deux objets dans l'ordre
    // inverse ; on identifie donc le shuriken explicitement.
    this.shurikens = this.physics.add.group({ allowGravity: false })
    this.physics.add.collider(this.shurikens, solids, (a, b) => asShuriken(a, b)?.destroy())
    this.physics.add.overlap(this.shurikens, this.enemies, (a, b) => {
      const shuriken = asShuriken(a, b)
      const enemy = [a, b].find((obj) => obj instanceof Enemy)
      if (!shuriken || !enemy) return
      shuriken.destroy()
      this.defeatEnemy(enemy)
    })

    const hud = new Hud(this)
    const healthBar = hud.addBar({
      texture: KENNEY.tiles,
      fullFrame: TILES.heartFull,
      emptyFrame: TILES.heartEmpty,
      lostFrame: TILES.heartHalf,
      max: PLAYER_MAX_HEALTH,
      spacing: HEART_SPACING,
    })
    this.player.on(HEALTH_CHANGED, (health: number) => healthBar.setValue(health))
    this.player.on(HEALTH_DEPLETED, () => this.loseLife())
    this.livesCounter = new LivesCounter(this, healthBar.right + LIVES_GAP, healthBar.y, this.lives)
    this.ammoCounter = hud.addCounter({ icon: TEX.shuriken, value: this.ammo })

    this.cameras.main.setBounds(0, 0, levelWidth, height)
    this.cameras.main.startFollow(this.player, true, 0.1, 0)

    this.inputController = new InputController(this)
    this.inputController.setThrowEnabled(this.ammo > 0)
  }

  /**
   * Crée un objet du niveau (coordonnées en tuiles). Point d'entrée unique : un futur chargeur
   * Tiled n'aura qu'à convertir ses objets (ex. classe « chest », propriété « shurikens ») en LevelObject.
   */
  private spawnObject(obj: LevelObject) {
    switch (obj.type) {
      case 'enemy':
        this.enemies.push(new Enemy(this, colCenter(obj.x), GROUND_TOP))
        break
      case 'checkpoint':
        this.createCheckpoint(colCenter(obj.x))
        break
      case 'finish':
        this.createFinish(colCenter(obj.x))
        break
      case 'heart':
        this.createHeart(colCenter(obj.x), rowCenter(obj.y ?? 1))
        break
      case 'coin':
        this.createCoin(colCenter(obj.x), rowCenter(obj.y ?? 1))
        break
      case 'chest':
        this.createChest(colCenter(obj.x), rowCenter(obj.y ?? 1) + TILE_SIZE / 2, obj.shurikens)
        break
    }
  }

  update() {
    this.inputController.update()
    for (const enemy of this.enemies) enemy.update()

    // Copie : un shuriken peut se détruire pendant sa mise à jour.
    for (const shuriken of [...this.shurikens.getChildren()]) shuriken.update()

    if (this.finished || this.losingLife) return

    this.player.update(this.inputController)
    if (this.inputController.throwPressed) this.tryThrow()

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

  /** Lance un shuriken dans la direction du regard, s'il en reste et si le délai est écoulé. */
  private tryThrow() {
    const now = this.time.now
    if (!this.player.canAct || now - this.lastThrowAt < SHURIKEN_COOLDOWN_MS) return
    this.lastThrowAt = now

    if (this.ammo === 0) {
      this.sfx.empty()
      return
    }

    const direction = this.player.facing
    // Lancé bas (10 px au-dessus des pieds) pour toucher les ennemis au sol, qui sont petits.
    const shuriken = new Shuriken(this, this.player.x + direction * 6, this.player.body.bottom - 10)
    this.shurikens.add(shuriken)
    shuriken.launch(direction)
    this.setAmmo(this.ammo - 1)
    this.sfx.throw()
  }

  private setAmmo(value: number) {
    this.ammo = value
    this.ammoCounter.setValue(value)
    this.inputController.setThrowEnabled(value > 0)
  }

  private defeatEnemy(enemy: Enemy) {
    const index = this.enemies.indexOf(enemy)
    if (!enemy.active || index === -1) return
    this.enemies.splice(index, 1)
    enemy.defeat()
    this.sfx.poof()
  }

  /** Coffre : à l'ouverture, ses shurikens jaillissent puis volent un par un jusqu'au compteur. */
  private createChest(x: number, bottom: number, shurikens?: number) {
    const chest = new Chest(this, x, bottom, { shurikens })
    this.physics.add.overlap(this.player, chest, () => {
      const reward = chest.open()
      if (reward === 0) return
      this.sfx.reward()

      const camera = this.cameras.main
      const start = { x: chest.x - camera.scrollX, y: chest.y - 10 - camera.scrollY }
      const target = this.ammoCounter.iconCenter
      for (let i = 0; i < reward; i++) {
        // Chaque shuriken vole à l'écran (fixe par rapport à la caméra), en jaillissant d'abord vers le haut.
        const star = this.add.image(start.x, start.y, TEX.shuriken).setScrollFactor(0).setDepth(1100).setVisible(false)
        const burstX = start.x + (i - (reward - 1) / 2) * 8
        this.tweens.chain({
          targets: star,
          delay: 150 + i * REWARD_STAGGER_MS,
          tweens: [
            { x: burstX, y: start.y - 22, angle: 180, duration: 220, ease: 'Quad.Out', onStart: () => star.setVisible(true) },
            { x: target.x, y: target.y, angle: 720, duration: REWARD_FLIGHT_MS, ease: 'Quad.In' },
          ],
          onComplete: () => {
            star.destroy()
            this.setAmmo(this.ammo + 1)
          },
        })
      }
    })
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
        this.scene.launch('GameOverScene', { coins: this.coins } satisfies GameOverData)
      }
    })
  }

  /** Levier du pack : il bascule quand le joueur passe, et devient le point de reprise. */
  private createCheckpoint(x: number) {
    const lever = this.add.image(x, GROUND_TOP, KENNEY.tiles, TILES.leverOff).setOrigin(0.5, 1)
    const zone = this.add.zone(x, GROUND_TOP - TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE)
    this.physics.add.existing(zone, true)

    let active = false
    this.physics.add.overlap(this.player, zone, () => {
      if (active) return
      active = true
      lever.setFrame(TILES.leverOn)
      this.player.setSpawn(x, SPAWN_Y)
    })
  }

  /** Cœur à ramasser : +1 cœur ; il reste en place si la barre est pleine. */
  private createHeart(x: number, y: number) {
    const heart = this.add.image(x, y, KENNEY.tiles, TILES.heartFull)
    this.physics.add.existing(heart, true)
    this.tweens.add({ targets: heart, y: y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    this.physics.add.overlap(this.player, heart, () => {
      if (!heart.active || !this.player.heal()) return
      this.tweens.killTweensOf(heart)
      heart.destroy()
    })
  }

  /** Pièce qui tourne : +1 au score, petit effet en disparaissant. */
  private createCoin(x: number, y: number) {
    const coin = this.add.sprite(x, y, KENNEY.tiles, TILES.coin).play(ANIMS.coinSpin)
    this.physics.add.existing(coin, true)

    let collected = false
    this.physics.add.overlap(this.player, coin, () => {
      if (collected) return
      collected = true
      this.coins++
      this.tweens.add({
        targets: coin,
        y: coin.y - 10,
        alpha: 0,
        duration: 250,
        onComplete: () => coin.destroy(),
      })
    })
  }

  /** Drapeau du pack (mât + drapeau animé), 2 tuiles de haut. */
  private createFinish(x: number) {
    this.add.image(x, GROUND_TOP, KENNEY.tiles, TILES.flagPole).setOrigin(0.5, 1)
    this.add.sprite(x, GROUND_TOP - TILE_SIZE, KENNEY.tiles, TILES.flag).setOrigin(0.5, 1).play(ANIMS.flagWave)

    const zone = this.add.zone(x, GROUND_TOP - TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE)
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
