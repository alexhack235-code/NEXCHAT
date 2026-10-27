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
        const uploadMod = './api/upload.js'; const { default: uploadHandler } = await import(/* @vite-ignore */ uploadMod);
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
        const serveBlobMod = './api/serve-blob.js'; const { default: serveBlobHandler } = await import(/* @vite-ignore */ serveBlobMod);
        await serveBlobHandler(req, res);
      } catch (err) {
        console.error('[Vite Dev API] /api/serve-blob error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (rawUrl.startsWith('/api/reels')) {
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
        if (!req.body && (req.method === 'POST' || req.method === 'PUT')) {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString();
          try { req.body = JSON.parse(rawBody); } catch (_) { req.body = {}; }
        }
        const reelsMod = './api/reels.js'; const { default: reelsHandler } = await import(/* @vite-ignore */ reelsMod);
        await reelsHandler(req, res);
      } catch (err) {
        console.error('[Vite Dev API] /api/reels error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (rawUrl.startsWith('/api/send-email-alert')) {
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
        if (!req.body && (req.method === 'POST' || req.method === 'PUT')) {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString();
          try { req.body = JSON.parse(rawBody); } catch (_) { req.body = {}; }
        }
        const emailAlertMod = './api/send-email-alert.js'; const { default: emailAlertHandler } = await import(/* @vite-ignore */ emailAlertMod);
        await emailAlertHandler(req, res);
      } catch (err) {
        console.error('[Vite Dev API] /api/send-email-alert error:', err);
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
  resolve: {
    alias: {
      'lenis': resolve(rootDir, 'src/js/lenis-esm.js')
    }
  },
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
