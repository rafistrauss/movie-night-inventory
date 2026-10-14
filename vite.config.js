import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const buildId = String(Date.now());

// Emits version.json so running clients can detect newer deployments
const versionFile = {
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId }) });
  }
};

export default defineConfig({
  plugins: [svelte(), versionFile],
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  base: '/movie-night-inventory/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  publicDir: 'public'
});
