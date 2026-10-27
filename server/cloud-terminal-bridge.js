/**
 * NEXCHAT Real Cloud Terminal Bridge Server
 * Connects browser WebSocket terminal sessions to a live Linux shell on Linode/VPS.
 *
 * Requirements on Linode:
 *   npm install ws node-pty
 * Run:
 *   node server/cloud-terminal-bridge.js
 * Or with PM2:
 *   pm2 start server/cloud-terminal-bridge.js --name "nex-cloud-terminal"
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');

const PORT = process.env.PORT || 7070;
const AUTH_SECRET = process.env.TERMINAL_SECRET;
if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  console.error('[SECURITY FATAL] TERMINAL_SECRET environment variable is missing or shorter than 32 characters.');
  process.exit(1);
}

// Detect shell: Linux/Linode defaults to /bin/bash; Windows defaults to powershell.exe
const isWindows = os.platform() === 'win32';
const DEFAULT_SHELL = isWindows ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');

let pty;
try {
  pty = require('node-pty');
  console.log('[NEX-TERMINAL] node-pty loaded successfully. Native pseudo-terminal ready.');
} catch (e) {
  console.warn('[NEX-TERMINAL] node-pty not installed. Falling back to standard child_process.');
  pty = null;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ONLINE',
    service: 'NEXCHAT Cloud Terminal Bridge',
    node: os.hostname(),
    uptime: process.uptime()
  }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientToken = url.searchParams.get('token');

  // Verify authorization token
  if (clientToken !== AUTH_SECRET) {
    console.warn(`[NEX-TERMINAL] Unauthorized connection attempt from ${req.socket.remoteAddress}`);
    ws.send('\r\n\x1b[31;1m[SECURITY ALERT] Unauthorized Access: Invalid or missing token.\x1b[0m\r\n');
    ws.close(1008, 'Unauthorized');
    return;
  }

  console.log(`[NEX-TERMINAL] Authorized session opened from ${req.socket.remoteAddress}`);

  let shellProcess;

  if (pty) {
    // Native pseudo-terminal with ANSI color, cursor movement, and resize
    shellProcess = pty.spawn(DEFAULT_SHELL, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: process.env
    });

    shellProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });

    shellProcess.onExit(({ exitCode }) => {
      console.log(`[NEX-TERMINAL] Shell process exited with code ${exitCode}`);
      if (ws.readyState === ws.OPEN) {
        ws.send(`\r\n\x1b[33m[PROCESS TERMINATED] Exit code: ${exitCode}\x1b[0m\r\n`);
        ws.close();
      }
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
          shellProcess.resize(parsed.cols, parsed.rows);
          return;
        }
      } catch (_) {
        // Raw keyboard input string
      }
      shellProcess.write(message.toString());
    });
  } else {
    // Basic child_process fallback
    const { spawn } = require('child_process');
    shellProcess = spawn(DEFAULT_SHELL, [], {
      cwd: process.env.HOME || process.cwd(),
      env: process.env
    });

    shellProcess.stdout.on('data', (data) => {
      if (ws.readyState === ws.OPEN) ws.send(data.toString());
    });
    shellProcess.stderr.on('data', (data) => {
      if (ws.readyState === ws.OPEN) ws.send(data.toString());
    });

    ws.on('message', (msg) => {
      shellProcess.stdin.write(msg.toString());
    });
  }

  ws.on('close', () => {
    console.log('[NEX-TERMINAL] WebSocket disconnected. Terminating shell process.');
    if (shellProcess) {
      try {
        if (shellProcess.kill) shellProcess.kill();
      } catch (err) {
        // Process cleanup
      }
    }
  });

  ws.on('error', (err) => {
    console.error('[NEX-TERMINAL] WebSocket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`[NEXCHAT] Real Cloud Terminal Bridge Listening on :${PORT}`);
  console.log(`Linode Host: ${os.hostname()} (${os.platform()} ${os.arch()})`);
  console.log(`Default Shell: ${DEFAULT_SHELL}`);
  console.log(`Endpoint: ws://YOUR_LINODE_IP:${PORT}?token=SECRET`);
  console.log(`===================================================`);
});
