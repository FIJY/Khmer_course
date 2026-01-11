import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // ВАЖНО: Делаем код понятным для старых браузеров
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    host: true
  }
})