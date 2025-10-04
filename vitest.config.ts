import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/ingest/__tests__/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
});
