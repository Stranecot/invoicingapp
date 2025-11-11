import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.e2e.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        'test/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@invoice-app/database': path.resolve(__dirname, 'src/packages/database/src'),
      '@invoice-app/auth': path.resolve(__dirname, 'src/packages/auth/src'),
      '@invoice-app/email': path.resolve(__dirname, 'src/packages/email/src'),
      '@': path.resolve(__dirname, 'src/apps/admin-dashboard'),
      '~/test': path.resolve(__dirname, 'test'),
    },
  },
});
