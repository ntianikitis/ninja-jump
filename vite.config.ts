import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Fichiers que l'outil tools/render-player.html a le droit d'écrire.
const PLAYER_ASSET_DIR = resolve(import.meta.dirname, 'public/assets/player')
const WRITABLE_PLAYER_ASSETS = new Set(['player.png', 'player.json'])

/** Dev uniquement : reçoit les fichiers générés par l'outil et les enregistre. */
function savePlayerAssets(): Plugin {
  return {
    name: 'save-player-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-player-asset', (req, res) => {
        const name = new URL(req.url ?? '', 'http://localhost').searchParams.get('name') ?? ''
        if (req.method !== 'POST' || !WRITABLE_PLAYER_ASSETS.has(name)) {
          res.statusCode = 400
          res.end('Fichier non autorisé')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          await mkdir(PLAYER_ASSET_DIR, { recursive: true })
          await writeFile(resolve(PLAYER_ASSET_DIR, name), Buffer.concat(chunks))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [savePlayerAssets()],
})
