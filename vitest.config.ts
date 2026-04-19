import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom', // Simule le navigateur pour les composants React
    globals: true,
    setupFiles: './vitest.setup.ts', // On préparera les mocks ici
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    // Mock server-only so server action tests can run in jsdom environment
    alias: {
      'server-only': new URL('./src/mocks/server-only.ts', import.meta.url).pathname,
    },
  },
})