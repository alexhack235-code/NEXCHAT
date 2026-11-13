import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  analyzeLocalFile, 
  healLocalFile, 
  scanProject, 
  rollbackFile 
} from './engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3300;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for local webview access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Serve Web View UI
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/webview') {
    const htmlPath = path.join(__dirname, 'web-view.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath, 'utf8'));
      return;
    }
  }

  // 2. API: Read File
  if (url.pathname === '/api/file' && req.method === 'GET') {
    const relPath = url.searchParams.get('path');
    if (!relPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }
    const absPath = path.resolve(ROOT_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }
    const content = fs.readFileSync(absPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ path: relPath, content }));
    return;
  }

  // 3. API: Scan
  if (url.pathname === '/api/scan' && req.method === 'GET') {
    try {
      const reports = scanProject();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: reports.length, reports }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 4. API: Heal File
  if (url.pathname === '/api/heal' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { filePath, customPrompt, dryRun } = body;
      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing filePath in body' }));
        return;
      }
      const result = await healLocalFile(filePath, {
        customPrompt,
        dryRun: Boolean(dryRun),
        autoApply: !dryRun
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 5. API: Rollback
  if (url.pathname === '/api/rollback' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { filePath } = body;
      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing filePath in body' }));
        return;
      }
      const resData = rollbackFile(filePath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...resData }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n[NEXCHAT CODE HEALER WEB VIEW] Server online at http://localhost:${PORT}`);
  console.log(`Ready for local browser and Anti-Matter Web QA integration.\n`);
});
