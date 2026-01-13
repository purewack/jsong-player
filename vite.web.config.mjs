import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  build: {
    // Output to project-root/docs so GitHub Pages can serve from the `docs/` folder
    outDir: '../../docs',
    emptyOutDir: true
  }
})
