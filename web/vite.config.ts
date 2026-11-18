import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api/<name> runs the same function file as on Vercel (web/api/<name>.ts),
// so lyrics and tempo lookups work the same on 127.0.0.1 as on the live site.
function devApi(): Plugin {
  return {
    name: 'rave-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z]+)(\?.*)?$/)
        if (!match) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const response: Response = await mod.GET(new Request(`http://127.0.0.1${req.url}`))
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch {
          res.statusCode = 404
          res.end()
        }
      })
    },
  }
}

// Spotify only accepts loopback redirects as 127.0.0.1 (not "localhost"), so the dev server
// runs there on a fixed port that matches the redirect URI in the Spotify dashboard.
export default defineConfig({
  plugins: [react(), devApi()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
})
