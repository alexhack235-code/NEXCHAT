const WebSocket = require('ws');
const { spawn } = require('child_process');
const http = require('http');

// Create HTTP server for WebSocket upgrade
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active terminals
const terminals = new Map();

// Authentication (in production, use proper auth)
const AUTH_USERS = {
    'nexchat-user': 'your-secure-password' // Change this!
};

wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    let authenticated = false;
    let terminal = null;
    let clientId = Math.random().toString(36).substring(7);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'auth') {
                // Handle authentication
                if (AUTH_USERS[data.username] === data.password) {
                    authenticated = true;
                    ws.send(JSON.stringify({ type: 'auth_success' }));

                    // Create new terminal session
                    terminal = spawn('bash', [], {
                        cwd: process.env.HOME || '/home',
                        env: { ...process.env, TERM: 'xterm-256color' }
                    });

                    terminals.set(clientId, terminal);

                    // Send terminal output to client
                    terminal.stdout.on('data', (data) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(data);
                        }
                    });

                    terminal.stderr.on('data', (data) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(data);
                        }
                    });

                    terminal.on('close', (code) => {
                        console.log(`Terminal ${clientId} closed with code ${code}`);
                        terminals.delete(clientId);
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send('\r\n\x1b[31mTerminal session ended\x1b[0m\r\n');
                        }
                    });

                    console.log(`Terminal session created for ${clientId}`);
                } else {
                    ws.send(JSON.stringify({ type: 'auth_failed' }));
                    ws.close();
                }
            } else if (data.type === 'system_info') {
                // Send system information
                const os = require('os');
                const info = {
                    hostname: os.hostname(),
                    platform: os.platform(),
                    arch: os.arch(),
                    cpus: os.cpus().length,
                    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
                    uptime: Math.round(os.uptime() / 3600) + 'h'
                };
                ws.send(JSON.stringify({
                    type: 'system_info',
                    info: `Hostname: ${info.hostname}, Platform: ${info.platform}, CPUs: ${info.cpus}, Memory: ${info.memory}, Uptime: ${info.uptime}`
                }));
            }
        } catch (e) {
            // Not JSON, treat as terminal input
            if (authenticated && terminal && !terminal.killed) {
                terminal.stdin.write(message);
            }
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket closed for ${clientId}`);
        if (terminal && !terminal.killed) {
            terminal.kill();
            terminals.delete(clientId);
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Linode Terminal Server running on port ${PORT}`);
    console.log('Make sure to configure authentication in AUTH_USERS!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    terminals.forEach((terminal) => {
        if (!terminal.killed) {
            terminal.kill();
        }
    });
    server.close(() => {
        process.exit(0);
    });
});</content>
<parameter name="filePath">c:\Users\Baha\Desktop\NEXCHAT\linode-terminal-server.js