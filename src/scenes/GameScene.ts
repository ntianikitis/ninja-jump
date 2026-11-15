import * as Phaser from 'phaser'
import { ANIMS, KENNEY, SKY_COLOR, TILE_SIZE, TILES } from '../art/kenneyTiles'
import { TEX } from '../art/pixelTextures'
import { Sfx } from '../audio/sfx'
import { setupWorldCamera, UI_OFFSET, VIEW_HEIGHT, VIEW_WIDTH } from '../display'
import {
  ENEMY_PATROL_DISTANCE,
  SPRING_VELOCITY,
  LIFE_LOST_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_START_LIVES,
  SHURIKEN_COOLDOWN_MS,
  SHURIKEN_START,
} from '../config'
import { InputController } from '../input/InputController'
import {
  imageKey,
  LAYERS,
  LEVEL_KEY,
  type LevelEntity,
  readBackgroundColor,
  readEntities,
  readImageLayer,
  TILESET_NAME,
} from '../levels/tiledLevel'
import { Chest } from '../objects/Chest'
import { Enemy } from '../objects/Enemy'
import { FlyingEnemy } from '../objects/FlyingEnemy'
import { MovingPlatform } from '../objects/MovingPlatform'
import { HEALTH_CHANGED, HEALTH_DEPLETED, Player } from '../objects/Player'
import { Shuriken } from '../objects/Shuriken'
import { Spring } from '../objects/Spring'
import { Hud } from '../ui/Hud'
import { LivesCounter } from '../ui/LivesCounter'
import type { TileCounter } from '../ui/TileCounter'
import type { GameOverData } from './GameOverScene'

// Hauteur du centre du joueur au-dessus de ses pieds à l'apparition (il tombe un peu).
const SPAWN_HEIGHT = 20
const RESTART_DELAY_MS = 2000
const LIVES_GAP = 4
// Les cœurs du pack (18 px, dessin d'environ 14 px) se suivent tous les 14 px.
const HEART_SPACING = 14
// Récompense d'un coffre : délai entre deux shurikens qui volent vers le compteur, durée du vol.
const REWARD_STAGGER_MS = 120
const REWARD_FLIGHT_MS = 650
// Profondeurs d'affichage des calques Tiled (le joueur et les objets sont à 0).
const DEPTH = { background: -100, decorBack: -10, terrain: -5, foreground: 500 }
// Pics : hauteur dangereuse (les pointes, en bas de la tuile) et marge sur les côtés.
const SPIKES_HEIGHT = 8
const SPIKES_SIDE_MARGIN = 2
/** Lit une propriété Tiled numérique, avec une valeur par défaut. */
const numberProp = (props: Record<string, unknown>, name: string, fallback: number) =>
  typeof props[name] === 'number' ? (props[name] as number) : fallback

/** Celui des deux objets d'un contact qui est un shuriken (l'ordre n'est pas garanti). */
const asShuriken = (a: unknown, b: unknown) => [a, b].find((obj) => obj instanceof Shuriken)

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private player!: Player
  private enemies: Enemy[] = []
  private platforms: MovingPlatform[] = []
  private shurikens!: Phaser.Physics.Arcade.Group
  private livesCounter!: LivesCounter
  private ammoCounter!: TileCounter
  private sfx!: Sfx
  private levelHeight = 0
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
    // La scène est réutilisée par restart() : on remet son état à zéro.
    this.enemies = []
    this.platforms = []
    this.finished = false
    this.lives = PLAYER_START_LIVES
    this.coins = 0
    this.ammo = SHURIKEN_START
    this.lastThrowAt = -Infinity
    this.losingLife = false
    this.sfx = new Sfx(this)

    // Map Tiled : calques de tuiles, terrain solide, puis objets.
    const map = this.make.tilemap({ key: LEVEL_KEY })
    const tileset = map.addTilesetImage(TILESET_NAME, KENNEY.tiles)
    if (!tileset) throw new Error(`Tileset « ${TILESET_NAME} » introuvable dans la map`)
    const levelWidth = map.widthInPixels
    this.levelHeight = map.heightInPixels

    setupWorldCamera(this)
    this.cameras.main.setBackgroundColor(readBackgroundColor(this) ?? SKY_COLOR)
    // Pas de bord en bas : le joueur doit pouvoir tomber dans les trous.
    this.physics.world.setBounds(0, 0, levelWidth, this.levelHeight)
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.createBackground(levelWidth)
    map.createLayer(LAYERS.decorBack, tileset)?.setDepth(DEPTH.decorBack)
    const terrain = map.createLayer(LAYERS.terrain, tileset)
    if (!terrain) throw new Error(`Calque « ${LAYERS.terrain} » introuvable dans la map`)
    terrain.setDepth(DEPTH.terrain).setCollisionByExclusion([-1])
    map.createLayer(LAYERS.foreground, tileset)?.setDepth(DEPTH.foreground)

    const entities = readEntities(map)
    const start = entities.find((e) => e.name === 'player-start')
    if (!start) throw new Error('Objet « player-start » manquant dans le calque Objets')
    if (!entities.some((e) => e.name === 'flag')) throw new Error('Objet « flag » manquant dans le calque Objets')

    this.player = new Player(this, start.x, start.bottom - SPAWN_HEIGHT)
    this.physics.add.collider(this.player, terrain)

    for (const entity of entities) this.spawnObject(entity)
    this.physics.add.collider(this.player, this.platforms)

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.player.hit((enemy as Enemy).x),
    )

    // Shurikens lancés : ils s'arrêtent sur le terrain, et battent les ennemis.
    // Attention : pour un groupe testé contre une liste ou un calque, Phaser peut passer les deux
    // objets dans l'ordre inverse ; on identifie donc le shuriken explicitement.
    this.shurikens = this.physics.add.group({ allowGravity: false })
    this.physics.add.collider(this.shurikens, terrain, (a, b) => asShuriken(a, b)?.destroy())
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

    // La caméra ne suit verticalement que si la map est plus haute que l'écran.
    const followY = this.levelHeight > VIEW_HEIGHT ? 0.1 : 0
    this.cameras.main.setBounds(0, 0, levelWidth, this.levelHeight)
    this.cameras.main.startFollow(this.player, true, 0.1, followY)

    this.inputController = new InputController(this)
    this.inputController.setThrowEnabled(this.ammo > 0)
  }

  /** Crée l'élément de jeu correspondant à un objet du calque Objets (par son nom). */
  private spawnObject({ name, x, bottom, width, height, props }: LevelEntity) {
    // Les objets « au sol » (pièces, cœurs…) ont leur centre une demi-tuile au-dessus de leur bas.
    const center = bottom - TILE_SIZE / 2
    switch (name) {
      case 'player-start':
        break
      case 'enemy':
        this.enemies.push(new Enemy(this, x, bottom, numberProp(props, 'patrol', ENEMY_PATROL_DISTANCE / TILE_SIZE) * TILE_SIZE))
        break
      case 'flyer':
        this.enemies.push(
          new FlyingEnemy(this, x, bottom, numberProp(props, 'patrol', 6) * TILE_SIZE, numberProp(props, 'amplitude', 1) * TILE_SIZE),
        )
        break
      case 'platform': {
        // Rectangle Tiled : (x, bottom) = centre en bas ; la plateforme part de son coin haut-gauche.
        const platformWidth = Math.max(width, TILE_SIZE)
        const top = bottom - Math.max(height, TILE_SIZE)
        this.platforms.push(
          new MovingPlatform(this, x - platformWidth / 2, top, platformWidth, {
            axis: props.axis === 'y' ? 'y' : 'x',
            distance: numberProp(props, 'distance', 4) * TILE_SIZE,
            speed: typeof props.speed === 'number' ? props.speed : undefined,
          }),
        )
        break
      }
      case 'spring':
        this.createSpring(x, bottom, numberProp(props, 'power', 1))
        break
      case 'spikes':
        this.createSpikes(x, bottom, Math.max(width, TILE_SIZE))
        break
      case 'coin':
        this.createCoin(x, center)
        break
      case 'heart':
        this.createHeart(x, center)
        break
      case 'energy':
        this.createEnergy(x, center)
        break
      case 'checkpoint':
        this.createCheckpoint(x, bottom)
        break
      case 'flag':
        this.createFinish(x, bottom)
        break
      case 'chest':
        this.createChest(x, bottom, typeof props.shurikens === 'number' ? props.shurikens : undefined)
        break
      default:
        console.warn(`Objet Tiled inconnu : « ${name} » (ignoré)`)
    }
  }

  update(time: number, delta: number) {
    this.inputController.update()
    for (const enemy of this.enemies) enemy.update(time, delta)
    for (const platform of this.platforms) platform.update(time)
    // Copie : un shuriken peut se détruire pendant sa mise à jour.
    for (const shuriken of [...this.shurikens.getChildren()]) shuriken.update()

    if (this.finished || this.losingLife) return

    this.player.update(this.inputController)
    if (this.inputController.throwPressed) this.tryThrow()

    // Tomber dans un trou fait perdre une vie directement.
    if (this.player.y > this.levelHeight + 34) {
      this.loseLife()
    }
  }

  /** Calque image « Fond » : répété horizontalement, avec la parallaxe réglée dans Tiled. */
  private createBackground(levelWidth: number) {
    const layer = readImageLayer(this, LAYERS.background)
    if (!layer) return
    const key = imageKey(layer.image)
    if (!this.textures.exists(key)) {
      console.warn(`Image de fond « ${layer.image} » non chargée (voir BootScene)`)
      return
    }
    const parallaxX = layer.parallaxx ?? 1
    const width = VIEW_WIDTH
    // Une couche qui défile à `parallaxX` parcourt (levelWidth - width) × parallaxX : on la remplit sur cette largeur.
    // (+ une vue de marge : avec le zoom centré, le bord gauche visible est décalé d'une demi-vue.)
    const span = 2 * width + (levelWidth - width) * parallaxX
    this.add
      .tileSprite(layer.offsetx ?? 0, layer.offsety ?? 0, span, this.textures.getFrame(key).height, key)
      .setOrigin(0)
      .setScrollFactor(parallaxX, layer.parallaxy ?? 1)
      .setDepth(DEPTH.background)
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
    this.player.playThrow()
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
    this.player.playDeath()

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
  private createCheckpoint(x: number, bottom: number) {
    const lever = this.add.image(x, bottom, KENNEY.tiles, TILES.leverOff).setOrigin(0.5, 1)
    const zone = this.add.zone(x, bottom - TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE)
    this.physics.add.existing(zone, true)

    let active = false
    this.physics.add.overlap(this.player, zone, () => {
      if (active) return
      active = true
      lever.setFrame(TILES.leverOn)
      this.player.setSpawn(x, bottom - SPAWN_HEIGHT)
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

  /** Ressort : en retombant dessus, le joueur est projeté vers le haut. */
  private createSpring(x: number, bottom: number, power: number) {
    const spring = new Spring(this, x, bottom, power)
    this.physics.add.collider(this.player, spring, () => {
      if (!this.player.body.touching.down) return
      spring.squash()
      this.player.bounce(SPRING_VELOCITY * spring.power)
      this.sfx.boing()
    })
  }

  /** Rangée de pics (largeur en px) : seules les pointes, en bas, font perdre un cœur. */
  private createSpikes(x: number, bottom: number, width: number) {
    this.add.tileSprite(x, bottom, width, TILE_SIZE, KENNEY.tiles, TILES.spikes).setOrigin(0.5, 1)
    const zone = this.add.zone(x, bottom - SPIKES_HEIGHT / 2, width - 2 * SPIKES_SIDE_MARGIN, SPIKES_HEIGHT)
    this.physics.add.existing(zone, true)
    this.physics.add.overlap(this.player, zone, () => this.player.hit(x))
  }

  /** Énergie (petit shuriken qui flotte) : +1 shuriken. */
  private createEnergy(x: number, y: number) {
    const energy = this.add.image(x, y, TEX.shuriken)
    this.physics.add.existing(energy, true)
    this.tweens.add({ targets: energy, y: y - 2, angle: 360, duration: 900, repeat: -1 })

    let collected = false
    this.physics.add.overlap(this.player, energy, () => {
      if (collected) return
      collected = true
      this.setAmmo(this.ammo + 1)
      this.sfx.pickup()
      this.tweens.killTweensOf(energy)
      this.tweens.add({ targets: energy, y: energy.y - 10, alpha: 0, duration: 250, onComplete: () => energy.destroy() })
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
  private createFinish(x: number, bottom: number) {
    this.add.image(x, bottom, KENNEY.tiles, TILES.flagPole).setOrigin(0.5, 1)
    this.add.sprite(x, bottom - TILE_SIZE, KENNEY.tiles, TILES.flag).setOrigin(0.5, 1).play(ANIMS.flagWave)

    // Zone d'arrivée sur toute la hauteur, jusqu'en haut de l'écran : on ne peut pas passer par-dessus
    // le drapeau en sautant (sinon on se retrouve bloqué au bout du niveau).
    const zone = this.add.zone(x, bottom / 2, TILE_SIZE, bottom)
    this.physics.add.existing(zone, true)
    this.physics.add.overlap(this.player, zone, () => this.finishLevel())
  }

  private finishLevel() {
    if (this.finished) return
    this.finished = true

    this.player.celebrate()

    const text = this.add
      .text(UI_OFFSET.x + VIEW_WIDTH / 2, UI_OFFSET.y + VIEW_HEIGHT / 2, 'Bravo !', {
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
