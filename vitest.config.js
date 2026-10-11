import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['**/node_modules/**', 'functions/**', 'temp_extract/**', 'Serwis_CRIST_Source_Dla_Githuba/**', 'tests/**', 'e2e/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
