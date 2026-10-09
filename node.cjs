const http = require('http');
const net = require('net');
const dgram = require('dgram');
const crypto = require('crypto');

// 1. DYNAMIC CONFIGURATION (Allows multiple instances on one machine)
const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 3000;
const TCP_PORT = parseInt(process.env.TCP_PORT) || 6000;
const UDP_PORT = parseInt(process.env.UDP_PORT) || 7000;

const TARGET_PEER_HOST = process.env.PEER_HOST || '127.0.0.1';
const TARGET_PEER_TCP = process.env.PEER_TCP ? parseInt(process.env.PEER_TCP) : null;
const TARGET_PEER_UDP = process.env.PEER_UDP ? parseInt(process.env.PEER_UDP) : null;

const DIFFICULTY = process.env.DIFFICULTY ? parseInt(process.env.DIFFICULTY) : 4;
const TX_BATCH_LIMIT = process.env.TX_BATCH_LIMIT ? parseInt(process.env.TX_BATCH_LIMIT) : 2; // How many txs required to trigger an automatic block mine

// Shared Ledger State & Local Mempool Staging
const blockchain = [];
const mempool = []; // Array of verified, unmined transactions
const connectedPeers = [];

/**
 * Cryptographic Utility: Calculates SHA-256 block hash
 */
function calculateHash(index, previousHash, timestamp, transactions, nonce) {
  return crypto
    .createHash('sha256')
    .update(index + previousHash + timestamp + JSON.stringify(transactions) + nonce)
    .digest('hex');
}

/**
 * Verification Utility: Validates the digital signature of a transaction payload
 */
function verifySignature(publicKeyPem, data, signatureHex) {
  try {
    const verifier = crypto.createVerify('sha256');
    verifier.update(JSON.stringify(data));
    verifier.end();
    return verifier.verify(publicKeyPem, signatureHex, 'hex');
  } catch (err) {
    return false;
  }
}

/**
 * Validates a standalone transaction before admitting it to the mempool
 */
function isValidTransaction(tx) {
  if (!tx || !tx.publicKey || !tx.message || !tx.signature) return false;
  return verifySignature(tx.publicKey, tx.message, tx.signature);
}

/**
 * Cryptographic Validation: Structural, PoW, and Batch Signature integrity checks
 */
function isValidBlock(newBlock, previousBlock) {
  if (!previousBlock && newBlock.index === 0) return true; // Genesis exception
  
  if (previousBlock.index + 1 !== newBlock.index) return false;
  if (previousBlock.hash !== newBlock.previousHash) return false;
  
  // Verify all batched transactions inside the block are authentic
  if (Array.isArray(newBlock.transactions)) {
    for (const tx of newBlock.transactions) {
      if (!isValidTransaction(tx)) {
        console.log(`[Validation Error] Block contains a forged transaction signature!`);
        return false;
      }
    }
  }

  const reconstructedHash = calculateHash(
    newBlock.index, 
    newBlock.previousHash, 
    newBlock.timestamp, 
    newBlock.transactions || [], 
    newBlock.nonce
  );
  
  if (newBlock.hash !== reconstructedHash) return false;
  return newBlock.hash.startsWith('0'.repeat(DIFFICULTY));
}

/**
 * Proof of Work Mining Loop for Batched Transactions
 */
function mineBlockAndBroadcast(transactions) {
  const lastBlock = blockchain[blockchain.length - 1];
  const index = blockchain.length;
  const previousHash = lastBlock.hash;
  
  console.log(`[Miner] Batch limit hit! Mining block ${index} with ${transactions.length} transactions...`);
  
  let nonce = 0;
  let timestamp = Date.now();
  let hash = '';
  const targetPrefix = '0'.repeat(DIFFICULTY);

  while (true) {
    hash = calculateHash(index, previousHash, timestamp, transactions, nonce);
    if (hash.startsWith(targetPrefix)) {
      break;
    }
    nonce++;
  }

  const minedBlock = { index, previousHash, timestamp, transactions, nonce, hash };
  blockchain.push(minedBlock);
  console.log(`[Miner] Success! Block Mined. Hash: ${hash}`);

  // Broadcast the finalized block to all peer nodes
  const payload = JSON.stringify({ type: 'NEW_BLOCK', block: minedBlock }) + '\n';
  connectedPeers.forEach(peer => {
    try {
      peer.write(payload);
    } catch (_err) {}
  });
}

// Hardcoded Valid Genesis Block
blockchain.push({
  index: 0,
  previousHash: "0",
  timestamp: 1465154705,
  transactions: [],
  nonce: 0,
  hash: "0000000000000000000000000000000000000000000000000000000000000000"
});

/**
 * Combined Inbound/Outbound Socket Pool Setup
 */
function registerPeerSocket(socket, type) {
  connectedPeers.push(socket);
  console.log(`[P2P Pool] Joined ${type} socket connection from ${socket.remoteAddress || '127.0.0.1'}:${socket.remotePort || 'unknown'}`);

  socket.write(JSON.stringify({ type: 'SYNC', chain: blockchain }) + '\n');

  socket.on('data', (data) => {
    try {
      const payloads = data.toString().trim().split('\n');
      payloads.forEach(payload => {
        if (!payload) return;
        const message = JSON.parse(payload);
        
        // Handle Transaction Gossiping
        if (message.type === 'NEW_TX') {
          const incomingTx = message.transaction;
          
          // Check if we already have it to prevent infinite feedback loop gossip
          const alreadyExists = mempool.some(tx => tx.signature === incomingTx.signature);
          
          if (!alreadyExists && isValidTransaction(incomingTx)) {
            mempool.push(incomingTx);
            console.log(`[P2P Mempool] Accepted gossiped transaction. Pool size: ${mempool.length}`);
            
            // Re-gossip out to other peers
            connectedPeers.forEach(peer => {
              if (peer !== socket) {
                try {
                  peer.write(JSON.stringify({ type: 'NEW_TX', transaction: incomingTx }) + '\n');
                } catch (_e) {}
              }
            });

            // If mempool matches capacity requirements, trigger local mining race
            if (mempool.length >= TX_BATCH_LIMIT) {
              const batch = mempool.splice(0, TX_BATCH_LIMIT);
              mineBlockAndBroadcast(batch);
            }
          }
        }
        
        // Handle Minted Blocks
        if (message.type === 'NEW_BLOCK') {
          const remoteBlock = message.block;
          const localLastBlock = blockchain[blockchain.length - 1];
          
          if (isValidBlock(remoteBlock, localLastBlock)) {
            blockchain.push(remoteBlock);
            console.log(`[P2P Mesh] Integrated newly mined block index ${remoteBlock.index}`);
            
            // Evict transactions included in this block from our local mempool staging area
            if (Array.isArray(remoteBlock.transactions)) {
              remoteBlock.transactions.forEach(remoteTx => {
                const matchIndex = mempool.findIndex(localTx => localTx.signature === remoteTx.signature);
                if (matchIndex > -1) mempool.splice(matchIndex, 1);
              });
            }
          }
        }
        
        if (message.type === 'SYNC') {
          if (Array.isArray(message.chain) && message.chain.length > blockchain.length) {
            let chainValid = true;
            for (let i = 1; i < message.chain.length; i++) {
              if (!isValidBlock(message.chain[i], message.chain[i-1])) {
                chainValid = false;
                break;
              }
            }
            if (chainValid) {
              console.log(`[P2P Consensus] Synchronized to longer blockchain validation history.`);
              blockchain.length = 0;
              blockchain.push(...message.chain);
            }
          }
        }
      });
    } catch (err) {}
  });

  socket.on('close', () => {
    const index = connectedPeers.indexOf(socket);
    if (index > -1) {
      connectedPeers.splice(index, 1);
      console.log(`[P2P Pool] A ${type} socket disconnected.`);
    }
  });
  socket.on('error', () => {});
}

function connectToPeer(host, port) {
  console.log(`[P2P Outbound] Attempting TCP dial to remote peer -> ${host}:${port}`);
  const clientSocket = net.connect({ host, port }, () => {
    console.log(`[P2P Outbound] Successfully connected to peer server!`);
    registerPeerSocket(clientSocket, 'OUTBOUND');
  });
  clientSocket.on('error', (err) => {
    console.log(`[P2P Outbound] Could not dial peer at ${host}:${port} (${err.message}). Retrying in 10s...`);
    setTimeout(() => connectToPeer(host, port), 10000);
  });
}

/**
 * 2. HTTP Server Gateway (RPC Interface)
 */
const httpServer = http.createServer((req, res) => {
  if (req.url === '/chain' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(blockchain, null, 2));
  }

  // GET /mempool - View unmined transactions currently waiting in queue
  if (req.url === '/mempool' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(mempool, null, 2));
  }

  // GET /wallet - Generate cryptographic RSA public/private keypair
  if (req.url === '/wallet' && req.method === 'GET') {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ privateKey, publicKey }));
  }

  // POST /transact - Receive a signed transaction and place it in the mempool
  if (req.url === '/transact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const tx = JSON.parse(body || '{}');
        
        if (!isValidTransaction(tx)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Cryptographic signature validation failed!" }));
        }

        // Add to local mempool
        mempool.push(tx);
        console.log(`[HTTP API] Transaction added to local mempool. Size: ${mempool.length}`);

        // Gossip the unmined transaction to all P2P network sockets
        const payload = JSON.stringify({ type: 'NEW_TX', transaction: tx }) + '\n';
        connectedPeers.forEach(peer => {
          try {
            peer.write(payload);
          } catch (_e) {}
        });

        // Check if our local mempool batch size has hit the limit
        if (mempool.length >= TX_BATCH_LIMIT) {
          // Extract the exact batch slice out of the mempool
          const batch = mempool.splice(0, TX_BATCH_LIMIT);
          // Mine asynchronous block off thread
          setImmediate(() => mineBlockAndBroadcast(batch));
        }

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Queued in Mempool', poolPosition: mempool.length }));
      } catch (err) {
        res.writeHead(400); res.end('Formatting Error');
      }
    });
    return;
  }

  // POST /block - Direct fallback block mining endpoint
  if (req.url === '/block' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const simulatedTx = {
          publicKey: "SYSTEM_GATEWAY",
          message: parsed.data || "Direct Gateway Block",
          signature: "DIRECT_GATEWAY_AUTH"
        };
        mineBlockAndBroadcast([simulatedTx]);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Mined & Broadcasted', block: blockchain[blockchain.length - 1] }));
      } catch (err) {
        res.writeHead(400); res.end('Invalid Payload');
      }
    });
    return;
  }

  res.writeHead(404); res.end();
});

httpServer.listen(HTTP_PORT, () => console.log(`[HTTP Gateway] Server executing on RPC port ${HTTP_PORT}`));

/**
 * 3. TCP Server (Inbound Network Listener)
 */
const tcpServer = net.createServer((socket) => registerPeerSocket(socket, 'INBOUND'));
tcpServer.listen(TCP_PORT, () => {
  console.log(`[TCP Engine] Listening on P2P Port ${TCP_PORT}`);
  if (TARGET_PEER_TCP) connectToPeer(TARGET_PEER_HOST, TARGET_PEER_TCP);
});

/**
 * 4. UDP Server (Discovery Scanner)
 */
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  const messageStr = msg.toString();
  if (messageStr.startsWith('DISCOVER_PEER')) {
    udpServer.send(Buffer.from(`PONG_PEER:${TCP_PORT}`), rinfo.port, rinfo.address);
  } else if (messageStr.startsWith('PONG_PEER')) {
    const remoteTcpPort = parseInt(messageStr.split(':')[1]);
    console.log(`[UDP Discovery] Found operational node via UDP at ${rinfo.address}:${remoteTcpPort}`);
    const alreadyConnected = connectedPeers.some(p => p.remotePort === remoteTcpPort || p.port === remoteTcpPort);
    if (!alreadyConnected) connectToPeer(rinfo.address, remoteTcpPort);
  }
});

udpServer.bind(UDP_PORT, () => {
  console.log(`[UDP Discovery] Active on port ${UDP_PORT}`);
  if (TARGET_PEER_UDP) {
    setInterval(() => {
      if (connectedPeers.length === 0) {
        console.log(`[UDP Discovery] Blasting discovery ping out to ${TARGET_PEER_HOST}:${TARGET_PEER_UDP}`);
        udpServer.send(Buffer.from(`DISCOVER_PEER:${TCP_PORT}`), TARGET_PEER_UDP, TARGET_PEER_HOST);
      }
    }, 5000);
  }
});
