import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Просто разрешаем Vite обрабатывать .wasm как статические ассеты
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    // Исключаем harfbuzzjs из предварительной сборки, чтобы не ломать внутренние пути
    exclude: ['harfbuzzjs']
  }
})