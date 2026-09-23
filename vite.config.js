import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const htmlFiles = readdirSync(rootDir).filter(file => file.endsWith('.html'))
const input = htmlFiles.reduce((entries, file) => {
  const name = file === 'index.html' ? 'index' : file.replace(/\.html$/, '')
  entries[name] = resolve(rootDir, file).replace(/\\/g, '/')
  return entries
}, {})

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: false,
    minify: 'esbuild',
    rollupOptions: {
      input,
      output: {
        manualChunks: undefined,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false
  }
})
