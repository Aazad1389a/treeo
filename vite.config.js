import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  resolve: {
    alias: {
      'three-real': fileURLToPath(new URL('./node_modules/three/build/three.module.js', import.meta.url)),
      three: fileURLToPath(new URL('./src/systems/ultraGraphics.js', import.meta.url))
    }
  },
  build: { target: 'es2020' }
});
