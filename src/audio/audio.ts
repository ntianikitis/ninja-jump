import type * as Phaser from 'phaser'
import { JINGLE_VOLUME, JINGLES, MUSIC_FILE, MUSIC_VOLUME } from '../config'

const MUSIC_KEY = 'music'
const MUTE_STORAGE_KEY = 'ninja-jump-muted'
// Volume de la musique pendant un jingle (on la baisse pour qu'il s'entende bien).
const DUCKED_MUSIC_VOLUME = 0.08
/** Événement du jeu émis à chaque changement « son coupé / son activé » (valeur : muet ou non). */
export const MUTE_CHANGED = 'mute-changed'

export type JingleName = keyof typeof JINGLES

/** Charge la musique et les jingles (.m4a, lu par tous les navigateurs actuels, y compris sur iPhone). */
export function loadAudio(scene: Phaser.Scene) {
  scene.load.audio(MUSIC_KEY, `assets/audio/${MUSIC_FILE}`)
  // Un même fichier peut servir à plusieurs moments : on ne le charge qu'une fois.
  for (const name of new Set(Object.values(JINGLES))) {
    scene.load.audio(name, `assets/audio/${name}.m4a`)
  }
}

/** Reprend le choix « son coupé » mémorisé dans le navigateur (s'il est disponible). */
export function restoreMute(game: Phaser.Game) {
  try {
    game.sound.mute = localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    // Stockage indisponible (navigation privée…) : le son reste activé.
  }
}

export function toggleMute(scene: Phaser.Scene) {
  // On garde la nouvelle valeur : relire sound.mute juste après l'avoir changé renvoie encore l'ancienne
  // (Phaser applique le changement de volume avec un léger différé).
  const muted = !scene.sound.mute
  scene.sound.mute = muted
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Choix non mémorisé, mais appliqué pour cette partie.
  }
  scene.game.events.emit(MUTE_CHANGED, muted)
}

const music = (scene: Phaser.Scene) => scene.sound.get(MUSIC_KEY) as Phaser.Sound.WebAudioSound | null

/** Lance la musique de fond en boucle, si elle ne joue pas déjà (elle continue d'une scène à l'autre). */
export function startMusic(scene: Phaser.Scene) {
  const current = music(scene) ?? (scene.sound.add(MUSIC_KEY, { loop: true, volume: MUSIC_VOLUME }) as Phaser.Sound.WebAudioSound)
  if (!current.isPlaying) current.play()
}

// Jingles en cours : la musique ne remonte qu'à la fin du dernier (ils peuvent se chevaucher).
let playingJingles = 0

/** Joue un jingle en baissant la musique le temps qu'il dure. */
export function playJingle(scene: Phaser.Scene, name: JingleName) {
  const jingle = scene.sound.add(JINGLES[name], { volume: JINGLE_VOLUME })
  playingJingles++
  music(scene)?.setVolume(DUCKED_MUSIC_VOLUME)
  jingle.once('complete', () => {
    jingle.destroy()
    playingJingles = Math.max(0, playingJingles - 1)
    if (playingJingles === 0) music(scene)?.setVolume(MUSIC_VOLUME)
  })
  jingle.play()
}
