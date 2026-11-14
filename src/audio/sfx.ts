import type * as Phaser from 'phaser'

/**
 * Petits sons synthétisés (Web Audio), sans fichier : à remplacer plus tard par de vrais sons.
 * Silencieux si le navigateur n'a pas Web Audio.
 */
export class Sfx {
  private readonly ctx?: AudioContext

  constructor(scene: Phaser.Scene) {
    const manager = scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>
    this.ctx = manager.context
  }

  /** Sifflement court du lancer. */
  throw() {
    this.noise(0.12, 0.12, 5000, 1500)
  }

  /** « Poof » d'un ennemi touché : souffle grave + note qui descend. */
  poof() {
    this.noise(0.25, 0.25, 900, 200)
    this.tone(260, 90, 0.18, 'triangle', 0.15)
  }

  /** Clic sec : plus de shurikens. */
  empty() {
    this.tone(140, 120, 0.06, 'square', 0.08)
  }

  /** Petit « tip » : objet ramassé. */
  pickup() {
    this.tone(990, 1480, 0.08, 'triangle', 0.12)
  }

  /** Petite mélodie montante : coffre ouvert. */
  reward() {
    ;[660, 880, 1320].forEach((freq, i) => this.tone(freq, freq, 0.12, 'triangle', 0.15, i * 0.09))
  }

  private tone(from: number, to: number, duration: number, type: OscillatorType, volume: number, delay = 0) {
    const ctx = this.ctx
    if (!ctx) return
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(to, start + duration)
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration)
  }

  /** Bruit blanc filtré, dont la fréquence glisse de `from` à `to` Hz. */
  private noise(duration: number, volume: number, from: number, to: number) {
    const ctx = this.ctx
    if (!ctx) return
    const start = ctx.currentTime
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(from, start)
    filter.frequency.exponentialRampToValueAtTime(to, start + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(start)
  }
}
