import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Proxy the API so /api/me and profiles work against a local server, as nginx does in production.
  server: { port: 5174, proxy: { '/api': 'http://localhost:3001' } },
})
