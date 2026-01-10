import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path' // <--- Добавь импорт path

export default defineConfig({
  envDir: '../', // <--- ВОТ ЭТА МАГИЯ. Ищи .env на уровень выше
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Khmer Mastery',
        short_name: 'KhmerApp',
        description: 'Learn Khmer from Zero to Local',
        theme_color: '#121212',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})