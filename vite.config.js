import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString("pl-PL", {timeZone: "Europe/Warsaw"}))
  },
  base: './',
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.js"], exclude: ['**/node_modules/**', '**/dist/**', '**/functions/**', '**/e2e/**'] },
  build: { 
      sourcemap: false, 
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions', 'firebase/messaging'],
            'ui-vendor': ['recharts', 'lucide-react']
          }
        }
      }
    }, 
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-192x192.jpg'],
      manifest: {
        id: './',
        name: 'VexoNT - System Utrzymania Ruchu',
        short_name: 'VexoNT',
        description: 'System zarządzania awariami i serwisem VexoNT CMMS',
        theme_color: '#1B253B',
        background_color: '#1B253B',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'any',
        scope: './',
        start_url: './?source=pwa',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      }
    })
  ]
})
