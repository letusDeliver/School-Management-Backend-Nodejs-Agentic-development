import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Set before any module (including src/config/env.js) is loaded, so
    // Zod env validation passes without requiring a real .env file in CI.
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-please-override-32chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-please-override-32chars',
      CORS_ORIGIN: 'http://localhost:4200',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
