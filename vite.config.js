import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});
