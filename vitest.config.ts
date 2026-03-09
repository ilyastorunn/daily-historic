import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts', 'search/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
});
