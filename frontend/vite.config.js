import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/departments': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/asset-categories': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/employees': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/assets': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/allocations': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/transfer-requests': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/bookings': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/maintenance-requests': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/dashboard': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/activity-log': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
