import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/integrations/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json'],
      reportsDirectory: './coverage/integration',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.config.ts',
        '**/tests/**',
      ],
    }
  }
});
