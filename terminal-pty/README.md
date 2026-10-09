# Node-PTY & XTerm WebSocket Terminal

This project implements an interactive pseudo-terminal (PTY) web terminal using:
- **Backend:** `express`, `ws` (WebSocketServer), and `node-pty` (with interactive fallback)
- **Frontend:** `@xterm/xterm` with `@xterm/addon-fit` and ANSI styling

## Architecture

```
┌─────────────────────────────────┐           WebSocket (ws / wss)          ┌───────────────────────────────────┐
│ Browser Client                  │ ◄─────────────────────────────────────► │ Node.js Backend                   │
│                                 │                                         │                                   │
│  @xterm/xterm Canvas/DOM Engine │   { type: 'input', data: 'ls -la\r' }   │  ws.on('message') -> pty.write()  │
│  FitAddon dynamic column resize │ ──────────────────────────────────────► │                                   │
│                                 │                                         │  pty.onData() -> ws.send()        │
│  Renders ANSI 256 colors & font │ ◄────────────────────────────────────── │                                   │
│                                 │   { type: 'output', data: '...' }       │  pty.spawn(shell, cols, rows)     │
└─────────────────────────────────┘                                         └───────────────────────────────────┘
```

## Quick Start

```bash
# 1. Install dependencies
npm install express ws node-pty @xterm/xterm @xterm/addon-fit

# 2. Run backend
node server.js

# 3. Mount TerminalComponent.jsx in your React application
```
