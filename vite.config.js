import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import customProperties from 'postcss-custom-properties';
import c47Layout from './postcss-c47.js';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig({
  plugins: [legacy({ targets: ['chrome 47', 'ie 11'], additionalLegacyPolyfills: ['abortcontroller-polyfill/dist/polyfill-patch-fetch'] })],
  css: { postcss: { plugins: [customProperties({ preserve: false }), c47Layout()] } },
  base: './', // Essential for relative asset paths in local Tizen file/web server environment
  define: {
    // Lets the UI show which build is actually running — useful for
    // confirming a TV picked up a new publish rather than a stale install.
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  server: {
    port: 5173,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssTarget: 'chrome47',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks(id) {
          if (id.includes('hls.js')) {
            return 'hls';
          }
        }
      }
    }
  }
});
