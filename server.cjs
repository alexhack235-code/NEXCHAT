// server.cjs
// High-Performance Localhost Preview Server & Email Dispatcher for NEXCHAT
const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  sendNotificationEmail,
  createPasswordResetEmail,
  createDeviceLinkEmail,
  createOfflineMessageEmail,
  createExtensionConsentEmail,
  CONFIG
} = require('./src/js/email-dispatcher.cjs');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // ══════════════════════════════════════════════════════════════════════
  // POST API ENDPOINTS: GMAIL & SECURITY NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let parsed = {};
      try {
        if (body) parsed = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      // 1. Send Security or Message Alert Email
      if (reqPath === '/api/send-email-alert') {
        const { type, toEmail, data } = parsed;
        if (!toEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'toEmail parameter is required' }));
          return;
        }

        let subject = parsed.subject || 'NEXCHAT Notification';
        let htmlContent = '';

        if (type === 'device_linked') {
          subject = '⚠️ NEXCHAT Security Alert: New Device Linked';
          htmlContent = createDeviceLinkEmail(data || {});
        } else if (type === 'password_reset') {
          subject = '🔐 NEXCHAT: Password Recovery & Security Key Reset';
          htmlContent = createPasswordResetEmail(data || {});
        } else if (type === 'offline_message') {
          subject = `💬 NEXCHAT: New message from ${data?.senderName || 'Contact'}`;
          htmlContent = createOfflineMessageEmail(data || {});
        } else if (type === 'extension_consent') {
          const isApproved = (data?.status === 'approved' || data?.status === 'granted' || data?.status === 'yes');
          const extName = data?.extensionName || 'NEX-REELS';
          subject = isApproved
            ? `🛡️ NEX-ECOSYSTEM: Access GRANTED to ${extName}`
            : `🛑 NEX-ECOSYSTEM: Access BLOCKED for ${extName}`;
          htmlContent = createExtensionConsentEmail(data || {});
        } else {
          htmlContent = parsed.htmlContent || `<p>${parsed.message || 'Notification from NEXCHAT'}</p>`;
        }

        try {
          const result = await sendNotificationEmail({ to: toEmail, subject, htmlContent });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // 2. Test Email Endpoint (for immediate verification)
      if (reqPath === '/api/test-email') {
        const toEmail = parsed.toEmail || CONFIG.GMAIL_USER;
        if (!toEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No recipient email specified' }));
          return;
        }

        try {
          const result = await sendNotificationEmail({
            to: toEmail,
            subject: '⚡ NEXCHAT Gmail Notification Test: SUCCESS',
            htmlContent: `
              <div style="background:#060913; color:#f8fafc; padding:24px; border-radius:12px; font-family:sans-serif; border:1px solid #00f076;">
                <h2 style="color:#00f076; margin:0 0 10px;">NEXCHAT GMAIL SMTP TEST</h2>
                <p>Congratulations! Your Gmail notification engine is operational and ready to dispatch real-time alerts.</p>
                <p style="color:#64748b; font-size:12px;">Dispatched from local server preview &bull; ${new Date().toISOString()}</p>
              </div>
            `,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API route not found' }));
    });
    return;
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATIC FILE SERVING
  // ══════════════════════════════════════════════════════════════════════
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/game.html';
  }
  reqPath = reqPath.replace(/^(\/\.\.)+/g, '');

  const safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    // Support HTTP Range requests (crucial for large GLB models and audio)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(safePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      fs.createReadStream(safePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`============================================================`);
  console.log(`🚀 NEXCHAT PREVIEW SERVER & EMAIL DISPATCHER ACTIVE ON PORT ${PORT}`);
  console.log(`📧 POST /api/send-email-alert  (Gmail Security & Offline Alerts)`);
  console.log(`⚡ POST /api/test-email        (Instant Verification Endpoint)`);
  console.log(`🔗 Central Metropolis: http://localhost:${PORT}/game.html?dev=1&autostart=1`);
  console.log(`🔗 App & Chat:         http://localhost:${PORT}/index.html`);
  console.log(`🔗 Link Device:        http://localhost:${PORT}/link-device.html`);
  console.log(`============================================================`);
});
