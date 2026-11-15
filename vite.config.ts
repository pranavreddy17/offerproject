
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,

  plugins: [react()],

  build: {
    target: 'es2020',
  },

  test: {
    globals: true,
    environment: 'jsdom',

    setupFiles: [
      fileURLToPath(new URL('./tests/setup.ts', import.meta.url)),
    ],

    css: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/engine/**'],
    },
  },
});
