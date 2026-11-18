import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Spotify only accepts loopback redirects as 127.0.0.1 (not "localhost"), so the dev server
// runs there on a fixed port that matches the redirect URI in the Spotify dashboard.
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
})
