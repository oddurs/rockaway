import { defineConfig } from 'vite';

/** The worst-case page that `worst.mjs` measures (cairn 0113). */
export default defineConfig({
  root: `${import.meta.dirname}/page`,
  base: './',
  build: { outDir: `${import.meta.dirname}/dist`, emptyOutDir: true },
});
