import * as Phaser from 'phaser'
import { TEX } from '../art/pixelTextures'
import { MUTE_CHANGED, toggleMute } from '../audio/audio'

// Zone cliquable plus grande que l'icône, pour les doigts.
const HIT_SIZE = 24

/** Bouton haut-parleur (et touche M) pour couper ou rétablir le son. */
export class SoundToggle extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, scene.sound.mute ? TEX.soundOff : TEX.soundOn)
    scene.add.existing(this)
    this.setScrollFactor(0).setDepth(1000)
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle((this.width - HIT_SIZE) / 2, (this.height - HIT_SIZE) / 2, HIT_SIZE, HIT_SIZE),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    this.on('pointerdown', () => toggleMute(scene))
    scene.input.keyboard?.on('keydown-M', () => toggleMute(scene))

    const update = (muted: boolean) => this.setTexture(muted ? TEX.soundOff : TEX.soundOn)
    scene.game.events.on(MUTE_CHANGED, update)
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.game.events.off(MUTE_CHANGED, update))
  }
}
