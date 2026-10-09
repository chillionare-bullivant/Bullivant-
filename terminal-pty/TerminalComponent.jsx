// TerminalComponent.jsx
import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalComponent() {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize xterm.js instance
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

    // Render into DOM container
    term.open(terminalRef.current);
    fitAddon.fit();

    // 2. Connect WebSocket (supports ws:// or wss:// depending on protocol)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Defaults to same host on path /ws/terminal or localhost:3001
    const wsUrl = window.location.port === '3000' 
      ? `${protocol}//${host}/ws/terminal` 
      : `${protocol}//${window.location.hostname}:3001`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send initial dimensions to backend
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    // 3. Render incoming backend binary/text data to terminal
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'output') {
        term.write(msg.data);
      }
    };

    // 4. Send user keystrokes from terminal back to server
    const onDataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // 5. Handle window resize events
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      onDataDisposable.dispose();
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, []);

  return (
    <div style={{ padding: '20px', background: '#000', borderRadius: '8px' }}>
      <div 
        ref={terminalRef} 
        style={{ width: '100%', height: '400px', overflow: 'hidden' }} 
      />
    </div>
  );
}
