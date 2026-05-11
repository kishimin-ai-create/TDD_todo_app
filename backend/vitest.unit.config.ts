import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.small.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json'],
      reportsDirectory: './coverage/unit',
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
