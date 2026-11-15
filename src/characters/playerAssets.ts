import * as Phaser from 'phaser'

// Fichiers dans public/assets/player/ (voir le README de ce dossier).
export const PLAYER_TEXTURE = 'player'
const PLAYER_CHARACTER = 'player-character'

export const PLAYER_ANIMS = ['idle', 'run', 'jump', 'fall', 'hurt', 'victory'] as const
/** Animations facultatives : jouées si l'atlas les fournit (lancer de shuriken, perte d'une vie). */
export const OPTIONAL_PLAYER_ANIMS = ['throw', 'death'] as const
export type PlayerAnim = (typeof PLAYER_ANIMS)[number] | (typeof OPTIONAL_PLAYER_ANIMS)[number]

export type CharacterManifest = {
  scale: number
  /** true = images lissées (personnage non pixel art) ; false ou absent = pixels nets. */
  smooth?: boolean
  /** En pixels de l'image ; centrée horizontalement, bottom = ligne des pieds. */
  hitbox: { width: number; height: number; bottom: number }
  animations: Partial<Record<PlayerAnim, { frameRate: number; repeat: number }>>
}

export const playerAnimKey = (anim: PlayerAnim) => `player-${anim}`

export function loadPlayerAssets(scene: Phaser.Scene) {
  scene.load.atlas(PLAYER_TEXTURE, 'assets/player/player.png', 'assets/player/player.json')
  scene.load.json(PLAYER_CHARACTER, 'assets/player/character.json')
}

export function getCharacterManifest(scene: Phaser.Scene): CharacterManifest {
  return scene.cache.json.get(PLAYER_CHARACTER)
}

/** Crée une animation par préfixe d'image de l'atlas (idle/00, idle/01…). */
export function createPlayerAnimations(scene: Phaser.Scene) {
  const { animations, smooth } = getCharacterManifest(scene)
  const texture = scene.textures.get(PLAYER_TEXTURE)
  if (smooth) texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
  const frameNames = texture.getFrameNames()

  const optional: readonly string[] = OPTIONAL_PLAYER_ANIMS
  for (const anim of [...PLAYER_ANIMS, ...OPTIONAL_PLAYER_ANIMS]) {
    const frames = frameNames
      .filter((name) => name.startsWith(`${anim}/`))
      .sort()
      .map((frame) => ({ key: PLAYER_TEXTURE, frame }))

    if (frames.length === 0) {
      if (optional.includes(anim)) continue
      throw new Error(`Animation « ${anim} » absente de l'atlas du joueur`)
    }

    scene.anims.create({ key: playerAnimKey(anim), frames, ...(animations[anim] ?? { frameRate: 10, repeat: 0 }) })
  }
}

/** Vrai si le personnage fournit cette animation (utile pour les animations facultatives). */
export const hasPlayerAnim = (scene: Phaser.Scene, anim: PlayerAnim) => scene.anims.exists(playerAnimKey(anim))
