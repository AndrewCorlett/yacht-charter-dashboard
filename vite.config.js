import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces (better for WSL2)
    port: 3005, // Always use port 3005
    strictPort: true, // Fail if port is not available
    watch: {
      usePolling: true // For WSL2
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true
  }
})
