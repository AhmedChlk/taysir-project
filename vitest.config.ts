import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    alias: {
      'server-only': new URL('./src/mocks/server-only.ts', import.meta.url).pathname,
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/actions/**/*.ts',
        'src/lib/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/mocks/**',
        'src/lib/auth.ts', // NextAuth config — requires real DB, not unit-testable
        'src/lib/prisma.ts', // Prisma client singleton — infrastructure
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
})