import type * as Phaser from 'phaser'

// Le monde du jeu mesure 320x180 (tuiles de 18 px) ; il est dessiné en 640x360 avec une caméra zoomée ×2,
// pour que le ninja, dessiné deux fois plus finement que les tuiles, garde tous ses détails.
export const VIEW_WIDTH = 320
export const VIEW_HEIGHT = 180
export const WORLD_ZOOM = 2

/**
 * Décalage à ajouter aux éléments fixes à l'écran (scrollFactor 0) : la caméra zoome autour de son centre,
 * ce décalage compense pour qu'un élément placé en (x, y) de la vue 320x180 apparaisse bien en (x, y).
 */
export const UI_OFFSET = {
  x: (VIEW_WIDTH * (WORLD_ZOOM - 1)) / 2,
  y: (VIEW_HEIGHT * (WORLD_ZOOM - 1)) / 2,
}

/** Zoom ×2 de la caméra principale (centré, ce que Phaser attend pour le suivi et les limites). */
export function setupWorldCamera(scene: Phaser.Scene) {
  scene.cameras.main.setZoom(WORLD_ZOOM)
}

/**
 * Agrandissement du canvas : le plus grand facteur entier qui tient dans la fenêtre (pixels nets) ;
 * si la fenêtre est plus petite que le jeu (téléphone en portrait), un facteur réduit pour tout voir.
 */
export function fitToWindow(game: Phaser.Game) {
  const scale = game.scale
  scale.getParentBounds()
  const ratio = Math.min(scale.parentSize.width / scale.gameSize.width, scale.parentSize.height / scale.gameSize.height)
  scale.setZoom(ratio >= 1 ? Math.floor(ratio) : ratio)
}
