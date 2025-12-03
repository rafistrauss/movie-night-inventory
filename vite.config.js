import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: '/movie-night-inventory/',
  build: {
    outDir: 'dist'
  }
});
