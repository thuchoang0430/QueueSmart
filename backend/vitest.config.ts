import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The auth suites share one PostgreSQL database and truncate it between
    // tests, so files must not run in parallel or they would clobber each other.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // index.ts only calls listen(), there is nothing meaningful to cover.
      exclude: ['src/index.ts'],
      // A3 asks for 70-80% coverage. Raise this as modules land.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
