import type * as Phaser from 'phaser'

// Niveau édité dans Tiled (voir la notice du CLAUDE.md).
export const LEVEL_KEY = 'level1'
export const LEVEL_URL = 'assets/maps/level1.tmj'

/** Noms des calques attendus dans la map. */
export const LAYERS = {
  background: 'Fond',
  decorBack: 'DecorArriere',
  terrain: 'Terrain',
  objects: 'Objets',
  foreground: 'PremierPlan',
} as const

/** Nom du tileset du pack dans Tiled (doit correspondre au fichier .tmj). */
export const TILESET_NAME = 'kenney-tiles'

/** Objet du calque Objets : nom, centre horizontal, bas et taille (en pixels), propriétés personnalisées. */
export type LevelEntity = {
  name: string
  x: number
  bottom: number
  width: number
  height: number
  props: Record<string, unknown>
}

type TiledProperty = { name: string; value: unknown }

/** Lit le calque Objets, quelle que soit la forme des objets (tuile, point ou rectangle). */
export function readEntities(map: Phaser.Tilemaps.Tilemap): LevelEntity[] {
  const layer = map.getObjectLayer(LAYERS.objects)
  if (!layer) throw new Error(`Calque « ${LAYERS.objects} » introuvable dans la map`)

  return layer.objects.map((obj) => {
    const width = obj.width ?? 0
    const height = obj.height ?? 0
    // Objet tuile : (x, y) = coin bas-gauche. Point : (x, y) = la position. Rectangle : coin haut-gauche.
    const bottom = obj.gid !== undefined || obj.point ? (obj.y ?? 0) : (obj.y ?? 0) + height
    const x = obj.point ? (obj.x ?? 0) : (obj.x ?? 0) + width / 2

    const raw = obj.properties as TiledProperty[] | Record<string, unknown> | undefined
    const props = Array.isArray(raw) ? Object.fromEntries(raw.map((p) => [p.name, p.value])) : (raw ?? {})
    return { name: obj.name ?? '', x, bottom, width, height, props }
  })
}

/** Calque image brut du JSON Tiled (Phaser ne garde ni la parallaxe ni la répétition). */
export type TiledImageLayer = {
  name: string
  image: string
  offsetx?: number
  offsety?: number
  parallaxx?: number
  parallaxy?: number
}

export function readImageLayer(scene: Phaser.Scene, name: string): TiledImageLayer | undefined {
  const json = scene.cache.tilemap.get(LEVEL_KEY)?.data as { layers: (TiledImageLayer & { type: string })[] } | undefined
  return json?.layers.find((layer) => layer.type === 'imagelayer' && layer.name === name)
}

/** Couleur de fond de la map (le ciel), si elle est définie dans Tiled. */
export function readBackgroundColor(scene: Phaser.Scene): string | undefined {
  return (scene.cache.tilemap.get(LEVEL_KEY)?.data as { backgroundcolor?: string } | undefined)?.backgroundcolor
}

/** Clé de texture d'une image de calque : son nom de fichier sans extension (ex. horizon-day). */
export const imageKey = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '')
