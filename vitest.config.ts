import { defineConfig } from 'vitest/config'

import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './tests/setup.ts',
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.tsx'],
    },
    onConsoleLog(log) {
      if (log.includes('ThrowingProvider error') || log.includes('The above error occurred')) {
        return false
      }
    },
  },
})
