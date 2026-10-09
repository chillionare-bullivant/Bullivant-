import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  CheckCircle2,
  Sparkles,
  Wifi,
  WifiOff,
  Code2,
  Layers,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

export function TerminalPtyStudio() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [activeTab, setActiveTab] = useState<"terminal" | "architecture" | "code">("terminal");
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [termDimensions, setTermDimensions] = useState<{ cols: number; rows: number }>({ cols: 80, rows: 24 });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const initTerminal = () => {
    if (!terminalRef.current) return;

    // Dispose old instances if any
    if (xtermInstanceRef.current) {
      xtermInstanceRef.current.dispose();
      xtermInstanceRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus("connecting");

    // 1. Initialize xterm.js instance
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      theme: {
        background: "#0a0e17",
        foreground: "#f1f5f9",
        cursor: "#38bdf8",
        selectionBackground: "#334155",
        black: "#1e293b",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#38bdf8",
        white: "#f8fafc",
        brightBlack: "#475569",
        brightRed: "#ef4444",
        brightGreen: "#22c55e",
        brightYellow: "#eab308",
        brightBlue: "#3b82f6",
        brightMagenta: "#a855f7",
        brightCyan: "#06b6d4",
        brightWhite: "#ffffff",
      },
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      lineHeight: 1.25,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Clear previous DOM children
    terminalRef.current.innerHTML = "";
    term.open(terminalRef.current);
    
    try {
      fitAddon.fit();
      setTermDimensions({ cols: term.cols, rows: term.rows });
    } catch (_e) {}

    xtermInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Connect WebSocket to /ws/terminal on current host (supports https: -> wss: and http: -> ws:)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      // Send initial dimensions to backend
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "output" && typeof msg.data === "string") {
          term.write(msg.data);
        }
      } catch {
        // Raw text fallback
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setConnectionStatus("disconnected");
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      term.write("\r\n\x1b[31m[WebSocket connection closed. Click Reconnect to restart session]\x1b[0m\r\n");
    };

    // Send user keystrokes from terminal back to server
    const onDataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle window resize events
    const handleResize = () => {
      try {
        fitAddon.fit();
        setTermDimensions({ cols: term.cols, rows: term.rows });
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      } catch (_e) {}
    };

    window.addEventListener("resize", handleResize);

    return () => {
      onDataDisposable.dispose();
      window.removeEventListener("resize", handleResize);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      term.dispose();
    };
  };

  useEffect(() => {
    const cleanup = initTerminal();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const sendQuickCommand = (cmd: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: cmd + "\r" }));
      if (xtermInstanceRef.current) {
        xtermInstanceRef.current.focus();
      }
    }
  };

  const clearTerminal = () => {
    if (xtermInstanceRef.current) {
      xtermInstanceRef.current.clear();
      xtermInstanceRef.current.focus();
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-mono border border-sky-500/30">
              <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Full-Stack Pseudo-Terminal (PTY)</span>
              <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400 animate-pulse" : connectionStatus === "connecting" ? "bg-amber-400" : "bg-rose-400"}`} />
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {connectionStatus === "connected" ? "Live Connected" : connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Interactive Web PTY Terminal
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real bidirectional pseudo-terminal stream powered by <b>@xterm/xterm</b>, <b>@xterm/addon-fit</b>, and
              WebSocket communication to native Node.js processes. Supports ANSI 256 colors, dynamic window resizing, and interactive shell execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2">
              <span className="text-slate-500">Dimensions:</span>
              <span className="text-sky-400 font-bold">{termDimensions.cols} &times; {termDimensions.rows}</span>
            </div>
            <button
              onClick={initTerminal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-2 border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reconnect</span>
            </button>
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                setTimeout(() => fitAddonRef.current?.fit(), 100);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title={isExpanded ? "Collapse height" : "Expand height"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4 text-sky-400" /> : <Maximize2 className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("terminal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "terminal"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Interactive Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "architecture"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PTY vs Pipe Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Copy Implementation Codes</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE TERMINAL */}
      {activeTab === "terminal" && (
        <div className="space-y-3">
          {/* Quick Command Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Quick Commands:
              </span>
              {[
                { label: "ls -la", cmd: "ls -la" },
                { label: "node -v", cmd: "node -v" },
                { label: "ps aux", cmd: "ps aux | head -n 12" },
                { label: "uptime", cmd: "uptime" },
                { label: "curl API", cmd: "curl -s http://localhost:3000/api/health" },
                { label: "free -m", cmd: "free -m" },
                { label: "df -h", cmd: "df -h" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => sendQuickCommand(btn.cmd)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={clearTerminal}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* xterm.js Terminal Container */}
          <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-3 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-500">pty-session • bash</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="text-slate-400">
                  Protocol: <b className="text-sky-400">WebSocket</b>
                </span>
                <span className="text-slate-400">
                  Status:{" "}
                  <b className={connectionStatus === "connected" ? "text-emerald-400" : "text-rose-400"}>
                    {connectionStatus}
                  </b>
                </span>
              </div>
            </div>

            <div
              ref={terminalRef}
              style={{
                width: "100%",
                height: isExpanded ? "640px" : "420px",
                overflow: "hidden",
              }}
            />
          </div>

          {/* Keyboard & Interactive Help */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between px-1">
            <span>
              Tip: Click inside the terminal to focus. All keystrokes, Tab auto-complete, arrow history, and Ctrl+C interrupt signals stream directly to the backend.
            </span>
            <span className="font-mono text-slate-500">
              Auto-fit: Active
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE & PTY VS PIPE */}
      {activeTab === "architecture" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              What is a Pseudo-Terminal (PTY)?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard Node.js <code>child_process.spawn</code> pipes standard input and output through non-terminal FIFO pipes.
              However, interactive terminal software (such as <code>bash</code> with color prompts, <code>vi</code>, <code>top</code>,
              line editing, tab completion, and password masks) tests whether file descriptor 0 is a terminal via <code>isatty()</code>.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-sky-300 space-y-1">
              <div className="text-slate-500">// Ordinary Pipe: isatty(fd) === false</div>
              <div className="text-rose-400">&times; No tab completion</div>
              <div className="text-rose-400">&times; No terminal resize signal (SIGWINCH)</div>
              <div className="text-rose-400">&times; Line buffering hides real-time characters</div>
              <div className="text-slate-500 pt-2">// PTY Master/Slave: isatty(fd) === true</div>
              <div className="text-emerald-400">&check; Full cursor positioning and raw mode</div>
              <div className="text-emerald-400">&check; Real-time Ctrl+C, Ctrl+D, Ctrl+Z handling</div>
              <div className="text-emerald-400">&check; Window resize broadcasts with cols/rows</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Why @xterm/addon-fit is Essential
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Terminals do not measure in pixels—they measure in character columns and rows (e.g., 80 &times; 24 or 140 &times; 40).
              <code>@xterm/addon-fit</code> measures the exact width and height of a character cell against the parent DOM element.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 space-y-1">
              <div className="text-indigo-300">1. Client calls fitAddon.fit()</div>
              <div className="text-indigo-300">2. Emits WebSocket resize event:</div>
              <div className="text-emerald-400">&#123; type: 'resize', cols: term.cols, rows: term.rows &#125;</div>
              <div className="text-indigo-300">3. Backend forwards to ptyProcess:</div>
              <div className="text-sky-300">ptyProcess.resize(cols, rows) &rarr; OS emits SIGWINCH</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CODE SNIPPETS & REPOSITORY */}
      {activeTab === "code" && (
        <div className="space-y-6">
          {/* server.js */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-200">terminal-pty/server.js</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`// server.js\nconst express = require('express');\nconst http = require('http');\nconst { WebSocketServer } = require('ws');\nconst pty = require('node-pty');\nconst os = require('os');\n\nconst app = express();\nconst server = http.createServer(app);\nconst wss = new WebSocketServer({ server });\n\nconst shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';\n\nwss.on('connection', (ws) => {\n  const ptyProcess = pty.spawn(shell, [], {\n    name: 'xterm-color',\n    cols: 80,\n    rows: 24,\n    cwd: process.env.HOME || process.cwd(),\n    env: process.env,\n  });\n\n  ptyProcess.onData((data) => {\n    if (ws.readyState === ws.OPEN) {\n      ws.send(JSON.stringify({ type: 'output', data }));\n    }\n  });\n\n  ws.on('message', (message) => {\n    try {\n      const parsed = JSON.parse(message);\n      if (parsed.type === 'input') {\n        ptyProcess.write(parsed.data);\n      } else if (parsed.type === 'resize') {\n        ptyProcess.resize(parsed.cols, parsed.rows);\n      }\n    } catch (err) {\n      console.error('Failed to handle incoming message:', err);\n    }\n  });\n\n  ws.on('close', () => {\n    ptyProcess.kill();\n  });\n});\n\nserver.listen(3001, () => {\n  console.log('PTY Terminal WebSocket backend running on ws://localhost:3001');\n});`, "server-code")}
                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === "server-code" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy server.js</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
              <pre>{`const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

wss.on('connection', (ws) => {
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: process.env,
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'input') {
        ptyProcess.write(parsed.data);
      } else if (parsed.type === 'resize') {
        ptyProcess.resize(parsed.cols, parsed.rows);
      }
    } catch (err) {
      console.error('Failed to handle incoming message:', err);
    }
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });
});

server.listen(3001, () => {
  console.log('PTY Terminal WebSocket backend running on ws://localhost:3001');
});`}</pre>
            </div>
          </div>

          {/* TerminalComponent.jsx */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">terminal-pty/TerminalComponent.jsx</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`import React, { useEffect, useRef } from 'react';\nimport { Terminal } from '@xterm/xterm';\nimport { FitAddon } from '@xterm/addon-fit';\nimport '@xterm/xterm/css/xterm.css';\n\nexport default function TerminalComponent() {\n  const terminalRef = useRef(null);\n\n  useEffect(() => {\n    if (!terminalRef.current) return;\n\n    const term = new Terminal({\n      cursorBlink: true,\n      theme: {\n        background: '#1e1e1e',\n        foreground: '#f0f0f0',\n        cursor: '#ffffff',\n        selectionBackground: '#5c5c5c',\n      },\n      fontSize: 14,\n      fontFamily: 'Consolas, \"Courier New\", monospace',\n    });\n\n    const fitAddon = new FitAddon();\n    term.loadAddon(fitAddon);\n\n    term.open(terminalRef.current);\n    fitAddon.fit();\n\n    const ws = new WebSocket('ws://localhost:3001');\n\n    ws.onopen = () => {\n      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));\n    };\n\n    ws.onmessage = (event) => {\n      const msg = JSON.parse(event.data);\n      if (msg.type === 'output') {\n        term.write(msg.data);\n      }\n    };\n\n    const onDataDisposable = term.onData((data) => {\n      if (ws.readyState === WebSocket.OPEN) {\n        ws.send(JSON.stringify({ type: 'input', data }));\n      }\n    });\n\n    const handleResize = () => {\n      fitAddon.fit();\n      if (ws.readyState === WebSocket.OPEN) {\n        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));\n      }\n    };\n    window.addEventListener('resize', handleResize);\n\n    return () => {\n      onDataDisposable.dispose();\n      window.removeEventListener('resize', handleResize);\n      ws.close();\n      term.dispose();\n    };\n  }, []);\n\n  return (\n    <div style={{ padding: '20px', background: '#000', borderRadius: '8px' }}>\n      <div ref={terminalRef} style={{ width: '100%', height: '400px', overflow: 'hidden' }} />\n    </div>\n  );\n}`, "jsx-code")}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === "jsx-code" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy TerminalComponent.jsx</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
              <pre>{`import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalComponent() {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        cursor: '#ffffff',
        selectionBackground: '#5c5c5c',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'output') {
        term.write(msg.data);
      }
    };

    const onDataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      onDataDisposable.dispose();
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, []);

  return (
    <div style={{ padding: '20px', background: '#000', borderRadius: '8px' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '400px', overflow: 'hidden' }} />
    </div>
  );
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
