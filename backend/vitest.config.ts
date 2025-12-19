import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration
 * 
 * Defines explicit test patterns:
 * - Unit tests: *.unit.test.ts - 5s timeout
 * - Integration tests: *.int.test.ts - 30s timeout
 * 
 * Run specific test types:
 *   npm run test:unit   - vitest run --testNamePattern="unit"
 *   npm run test:int    - vitest run --testNamePattern="int"
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],

    // Include both unit and integration test patterns
    include: [
      '**/*.unit.test.ts',
      '**/*.int.test.ts',
      // Legacy pattern support for existing tests
      '**/tests/**/*.test.ts',
    ],

    // Exclude e2e and node_modules
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.e2e.test.ts',
      '**/*.e2e.spec.ts',
    ],

    // Default timeout - unit tests are fast, integration can override per-file
    testTimeout: 5000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/types/**',
      ],
    },

    // Reporter configuration
    reporters: ['default'],

    // Pool configuration for isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
