import * as Phaser from 'phaser'
import { PX_ANIMS, TEX } from '../art/pixelTextures'
import { SHURIKENS_PER_CHEST } from '../config'

/**
 * Propriétés d'un coffre : les mêmes que celles d'un futur objet Tiled de classe « chest »
 * (propriété personnalisée `shurikens`).
 */
export type ChestProps = {
  /** Shurikens contenus (SHURIKENS_PER_CHEST par défaut). */
  shurikens?: number
}

/** Coffre à ouvrir en le touchant : une seule fois, puis il reste ouvert. Posé par ses pieds en (x, y). */
export class Chest extends Phaser.GameObjects.Sprite {
  private readonly shurikens: number
  private opened = false

  constructor(scene: Phaser.Scene, x: number, y: number, props: ChestProps = {}) {
    super(scene, x, y, TEX.chest[0])
    this.shurikens = props.shurikens ?? SHURIKENS_PER_CHEST
    this.setOrigin(0.5, 1)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
  }

  get isOpen() {
    return this.opened
  }

  /** Ouvre le coffre et renvoie son contenu (0 s'il était déjà ouvert). */
  open() {
    if (this.opened) return 0
    this.opened = true
    this.play(PX_ANIMS.chestOpen)
    return this.shurikens
  }
}
