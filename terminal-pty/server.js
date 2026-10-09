// server.js
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');
const { spawn } = require('child_process');

let pty = null;
try {
  pty = require('node-pty');
} catch (_err) {
  console.warn('[PTY] node-pty native binary not compiled. Falling back to interactive child_process pseudo-shell.');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Determine shell executable based on OS
const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');

wss.on('connection', (ws) => {
  console.log('[PTY] New terminal WebSocket client connected');

  let ptyProcess = null;

  if (pty) {
    // 1. Spawn a pseudo-terminal process with node-pty
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    });

    // 2. Stream terminal output (pty -> WebSocket -> Frontend)
    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: `\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n` }));
      }
    });
  } else {
    // Graceful fallback: spawn interactive child_process
    ptyProcess = spawn(shell, ['-i'], {
      cwd: process.env.HOME || process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        PS1: '\\[\\033[01;32m\\]\\u@node-pty\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ ',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    ptyProcess.stdout.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf-8') }));
      }
    });

    ptyProcess.stderr.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf-8') }));
      }
    });

    ptyProcess.on('exit', (code) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: `\r\n\x1b[33m[Process exited with code ${code}]\x1b[0m\r\n` }));
      }
    });
  }

  // 3. Handle messages from frontend (WebSocket -> pty)
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'input') {
        if (pty && ptyProcess.write) {
          ptyProcess.write(parsed.data);
        } else if (ptyProcess.stdin && !ptyProcess.stdin.destroyed) {
          ptyProcess.stdin.write(parsed.data);
        }
      } else if (parsed.type === 'resize') {
        // Handle terminal window resizing dynamically
        if (pty && typeof ptyProcess.resize === 'function') {
          ptyProcess.resize(parsed.cols, parsed.rows);
        }
      }
    } catch (err) {
      console.error('Failed to handle incoming message:', err);
    }
  });

  // 4. Cleanup process when client disconnects
  ws.on('close', () => {
    console.log('[PTY] Terminal WebSocket disconnected, killing process');
    try {
      if (ptyProcess.kill) {
        ptyProcess.kill();
      }
    } catch (_e) {}
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`PTY Terminal WebSocket backend running on ws://localhost:${PORT}`);
});
