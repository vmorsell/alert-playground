import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/incident-io': {
        target: 'https://api.incident.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/incident-io/, ''),
        headers: {
          'Origin': 'https://api.incident.io'
        }
      },
      '/api/firehydrant': {
        target: 'https://signals.firehydrant.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/firehydrant/, ''),
        headers: {
          'Origin': 'https://signals.firehydrant.com'
        }
      }
    }
  }
})
