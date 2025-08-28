import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [wasm()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'rapier': ['@dimforge/rapier3d']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d']
  },
  worker: {
    format: 'es'
  }
});
