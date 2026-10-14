import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false, // Prevents concurrent worker SSR transform cache collisions on Windows/CI
    isolate: false,
    testTimeout: 10000,
  },
});
