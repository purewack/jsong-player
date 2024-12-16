import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue(),
      {
        name: 'load-jsong',
        transform(src, id) {
          if (id.endsWith('.jsong')) {
            return {
              code: `export default ${JSON.stringify(JSON.parse(src))}`,
              map: null,
            };
          }
        },
      },
    ],
    server: {
      watch: {
        usePolling: true
      }
    }
  }
})
