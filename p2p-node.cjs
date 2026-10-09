const http = require('http');
const net = require('net');
const dgram = require('dgram');

const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 3000;
const TCP_PORT = parseInt(process.env.TCP_PORT) || 6000;
const UDP_PORT = parseInt(process.env.UDP_PORT) || 7000;

// Shared network state
const blockchain = [{ index: 0, data: "Genesis Block" }];
const connectedPeers = []; // Holds references to open TCP sockets

/**
 * P2P Helper: Floods a newly generated block to all connected TCP peers
 */
function broadcastNewBlock(block) {
  console.log(`[P2P Broadcast] Flooding block index ${block.index} to ${connectedPeers.length} peers...`);
  const payload = JSON.stringify({ type: 'NEW_BLOCK', block: block });
  connectedPeers.forEach((socket) => {
    try {
      socket.write(payload + '\n'); // Stream delimiter
    } catch (err) {
      console.error(`[P2P Error] Failed to send: ${err.message}`);
    }
  });
}

// 1. HTTP Server (Client API / RPC)
const httpServer = http.createServer((req, res) => {
  if (req.url === '/chain' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(blockchain, null, 2));
  }
  if (req.url === '/block' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const newBlock = { index: blockchain.length, data: parsed.data, timestamp: Date.now() };
        blockchain.push(newBlock);
        broadcastNewBlock(newBlock); // Flood to P2P network
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Success', block: newBlock }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});
httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP RPC] Listening on Port ${HTTP_PORT}`);
});

// 2. TCP Server (P2P Sync Engine)
const tcpServer = net.createServer((socket) => {
  connectedPeers.push(socket);
  socket.write(JSON.stringify({ type: 'SYNC', chain: blockchain }) + '\n');
  socket.on('data', (data) => {
    try {
      data.toString().trim().split('\n').forEach(p => {
        if (!p) return;
        const msg = JSON.parse(p);
        if (msg.type === 'NEW_BLOCK' && msg.block.index === blockchain.length) {
          blockchain.push(msg.block);
          console.log(`[TCP Engine] Received and integrated new block #${msg.block.index}`);
        }
      });
    } catch (_err) {}
  });
  socket.on('close', () => {
    const idx = connectedPeers.indexOf(socket);
    if (idx > -1) connectedPeers.splice(idx, 1);
  });
  socket.on('error', () => {});
});
tcpServer.listen(TCP_PORT, () => {
  console.log(`[TCP Engine] Listening on P2P Port ${TCP_PORT}`);
});

// 3. UDP Server (Peer Discovery Service)
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  console.log(`[UDP Discovery] Received discovery ping from ${rinfo.address}:${rinfo.port}`);
  udpServer.send(Buffer.from('PONG_DISCOVERY'), rinfo.port, rinfo.address);
});
udpServer.bind(UDP_PORT, () => {
  console.log(`[UDP Discovery] Active on port ${UDP_PORT}`);
});
