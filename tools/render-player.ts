/**
 * Outil de dev : filme le modèle 3D Kenney character-r image par image et produit
 * public/assets/player/player.png + player.json (atlas JSON Phaser).
 *
 * Ouvrir http://localhost:5173/tools/render-player.html          → aperçu seul
 *        http://localhost:5173/tools/render-player.html?save=1   → aperçu + enregistrement
 *        ...?poses=sprint:0.1,static:0                            → aperçu de poses libres
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '/assets-source/kenney-personnage/Models/GLB format/character-r.glb'

// Taille d'une image (px) ; le personnage occupe CHARACTER_RATIO de la hauteur.
const FRAME_SIZE = 160
const CHARACTER_RATIO = 0.8
const FEET_MARGIN = 8
// Vue de trois quarts : rotation de la caméra vers l'avant du personnage.
const CAMERA_ANGLE_DEG = 30

type Shot = {
  /** Nom de l'animation dans l'atlas (idle, run, jump, fall, hurt, victory). */
  name: string
  /** Animation du modèle 3D. */
  clip: string
  fps: number
  /** Début et fin (s) dans l'animation ; fin par défaut = durée de l'animation. */
  from?: number
  to?: number
  /** Nombre d'images forcé (ex. 1 pour une pose fixe). */
  count?: number
}

const SHOTS: Shot[] = [
  { name: 'idle', clip: 'idle', fps: 12 },
  { name: 'run', clip: 'sprint', fps: 16 },
  { name: 'jump', clip: 'sprint', fps: 1, from: 0.375, count: 1 },
  { name: 'fall', clip: 'sprint', fps: 1, from: 0.125, count: 1 },
  // Début de la chute seulement : ensuite le personnage est couché et sort du cadre.
  { name: 'hurt', clip: 'die', fps: 24, from: 0, to: 0.125 },
  { name: 'victory', clip: 'emote-yes', fps: 12 },
]

const status = document.querySelector<HTMLParagraphElement>('#status')!
const framesEl = document.querySelector<HTMLDivElement>('#frames')!
const sheet = document.querySelector<HTMLCanvasElement>('#sheet')!

async function main() {
  const params = new URLSearchParams(location.search)
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL)
  const model = gltf.scene
  const clips = new Map(gltf.animations.map((clip) => [clip.name, clip]))

  const scene = new THREE.Scene()
  scene.add(model)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(-1, 3, 2)
  scene.add(sun)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(FRAME_SIZE, FRAME_SIZE)
  renderer.setClearColor(0x000000, 0)

  // Cadrage fixe calculé sur la pose de repos : les pieds restent sur la même ligne.
  const mixer = new THREE.AnimationMixer(model)
  poseAt(mixer, clips.get('static')!, 0)
  const box = new THREE.Box3().setFromObject(model)
  const viewHeight = (box.max.y - box.min.y) / CHARACTER_RATIO
  const bottom = box.min.y - (FEET_MARGIN / FRAME_SIZE) * viewHeight
  const camera = new THREE.OrthographicCamera(-viewHeight / 2, viewHeight / 2, bottom + viewHeight, bottom, 0.1, 100)
  // Caméra à gauche du personnage (qui regarde vers +Z) : il apparaît tourné vers la droite.
  const angle = THREE.MathUtils.degToRad(CAMERA_ANGLE_DEG)
  camera.position.set(-10 * Math.cos(angle), 0, 10 * Math.sin(angle))
  camera.lookAt(0, 0, 0)

  const shots = params.has('poses') ? parsePoses(params.get('poses')!) : SHOTS
  const frames: { name: string; canvas: HTMLCanvasElement }[] = []

  for (const shot of shots) {
    const clip = clips.get(shot.clip)
    if (!clip) throw new Error(`Animation inconnue : ${shot.clip}`)
    const from = shot.from ?? 0
    const to = shot.to ?? clip.duration
    const count = shot.count ?? Math.max(1, Math.round((to - from) * shot.fps))

    for (let i = 0; i < count; i++) {
      poseAt(mixer, clip, from + i / shot.fps)
      renderer.render(scene, camera)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = FRAME_SIZE
      canvas.getContext('2d')!.drawImage(renderer.domElement, 0, 0)
      frames.push({ name: `${shot.name}/${String(i).padStart(2, '0')}`, canvas })
      addPreview(`${shot.name}/${i}`, canvas)
    }
  }

  const atlas = buildSheet(frames)
  const bounds = opaqueBounds(frames.find((f) => f.name === 'idle/00')?.canvas ?? frames[0].canvas)
  status.textContent = `${frames.length} images. Corps (idle/00) : ${JSON.stringify(bounds)}`

  if (params.has('save')) {
    const png = await new Promise<Blob>((resolve) => sheet.toBlob((b) => resolve(b!), 'image/png'))
    await save('player.png', png)
    await save('player.json', new Blob([JSON.stringify(atlas, null, 2)], { type: 'application/json' }))
    status.textContent += ' — enregistré dans public/assets/player/'
  }
  Object.assign(window, { __renderDone: { frames: frames.length, bounds } })
}

function poseAt(mixer: THREE.AnimationMixer, clip: THREE.AnimationClip, time: number) {
  mixer.stopAllAction()
  mixer.clipAction(clip).play()
  mixer.setTime(time)
}

function parsePoses(spec: string): Shot[] {
  return spec.split(',').map((part) => {
    const [clip, time] = part.split(':')
    return { name: `${clip}@${time}`, clip, fps: 1, from: Number(time), count: 1 }
  })
}

function buildSheet(frames: { name: string; canvas: HTMLCanvasElement }[]) {
  const columns = Math.ceil(Math.sqrt(frames.length))
  const rows = Math.ceil(frames.length / columns)
  sheet.width = columns * FRAME_SIZE
  sheet.height = rows * FRAME_SIZE
  const ctx = sheet.getContext('2d')!

  const atlasFrames: Record<string, object> = {}
  frames.forEach(({ name, canvas }, i) => {
    const x = (i % columns) * FRAME_SIZE
    const y = Math.floor(i / columns) * FRAME_SIZE
    ctx.drawImage(canvas, x, y)
    atlasFrames[name] = {
      frame: { x, y, w: FRAME_SIZE, h: FRAME_SIZE },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
      sourceSize: { w: FRAME_SIZE, h: FRAME_SIZE },
    }
  })

  return {
    frames: atlasFrames,
    meta: { image: 'player.png', size: { w: sheet.width, h: sheet.height }, scale: 1 },
  }
}

/** Rectangle des pixels non transparents, pour régler la hitbox. */
function opaqueBounds(canvas: HTMLCanvasElement) {
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE)
  let x0 = FRAME_SIZE, y0 = FRAME_SIZE, x1 = -1, y1 = -1
  for (let y = 0; y < FRAME_SIZE; y++) {
    for (let x = 0; x < FRAME_SIZE; x++) {
      if (data[(y * FRAME_SIZE + x) * 4 + 3] > 0) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      }
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, bottom: y1 + 1 }
}

function addPreview(label: string, source: HTMLCanvasElement) {
  const figure = document.createElement('figure')
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = FRAME_SIZE
  canvas.getContext('2d')!.drawImage(source, 0, 0)
  figure.append(canvas, label)
  framesEl.append(figure)
}

async function save(name: string, blob: Blob) {
  const res = await fetch(`/__save-player-asset?name=${name}`, { method: 'POST', body: blob })
  if (!res.ok) throw new Error(`Échec de l'enregistrement de ${name}`)
}

main().catch((error) => {
  status.textContent = `Erreur : ${error.message}`
  console.error(error)
})
