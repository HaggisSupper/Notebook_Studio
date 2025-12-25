import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default mergeConfig(
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }),
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          '**/types.ts',
          'vite.config.ts',
          'vitest.config.ts',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
  })
);
