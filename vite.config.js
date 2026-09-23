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

/**
 * Vite Dev Server Middleware Plugin
 * Directly executes /api/upload.js and /api/serve-blob.js during local development (npm run dev)
 * so that POST requests to /api/upload return 200 with live Vercel Blob URLs instead of static 405 Method Not Allowed.
 */
function vercelApiDevPlugin() {
  const handleApi = async (req, res, next) => {
    const rawUrl = req.url || '';
    if (rawUrl.startsWith('/api/upload')) {
      try {
        const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
        req.query = Object.fromEntries(parsedUrl.searchParams.entries());
        if (!res.status) {
          res.status = function(code) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function(data) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }
        const { default: uploadHandler } = await import('./api/upload.js');
        await uploadHandler(req, res);
      } catch (err) {
        console.error('[Vite Dev API] /api/upload error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (rawUrl.startsWith('/api/serve-blob')) {
      try {
        const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
        req.query = Object.fromEntries(parsedUrl.searchParams.entries());
        if (!res.status) {
          res.status = function(code) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function(data) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }
        const { default: serveBlobHandler } = await import('./api/serve-blob.js');
        await serveBlobHandler(req, res);
      } catch (err) {
        console.error('[Vite Dev API] /api/serve-blob error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    next();
  };

  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    }
  };
}

export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    vercelApiDevPlugin()
  ],
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
