import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Crist S.A. - Zgłaszanie Awarii',
        short_name: 'Crist Awarie',
        description: 'System zgłaszania awarii maszyn dla Crist S.A.',
        theme_color: '#0f172a',
        background_color: '#f3f4f6',
        display: 'standalone',
        icons: []
      }
    })
  ],
})
