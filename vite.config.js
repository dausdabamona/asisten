import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer')
    }
  }
})
