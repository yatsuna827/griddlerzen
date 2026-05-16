/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  base: '/griddlerzen/',
  plugins: [solid()],
  test: {
    globals: false,
    watch: false,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    includeSource: ['src/**/*.{ts,tsx}'],
  },
});
