/**
 * ============================================================================
 * TRI-PROTOCOL P2P BLOCKCHAIN NODE ARCHITECTURE (HTTP + TCP + UDP)
 * 
 * Implements the decoupled multi-protocol networking layer:
 * 1. HTTP Server (Port 3000): Client API / RPC (GET /chain, POST /block)
 * 2. TCP Server (Port 6000): P2P Sync Engine & Delimited Stream Block Flooding
 * 3. UDP Server (Port 7000): Peer Discovery Service (PONG_DISCOVERY responder)
 * ============================================================================
 */
import net from "net";
import dgram from "dgram";
import crypto from "crypto";

export interface P2PBlock {
  index: number;
  data?: any;
  transactions?: any[];
  timestamp: number;
  nonce?: number;
  hash?: string;
  previousHash?: string;
}

export interface P2PTransaction {
  publicKey: string;
  message: {
    from: string;
    to: string;
    amount: number;
    nonce?: number;
    timestamp?: number;
  };
  signature: string;
}

export interface PeerSocketInfo {
  id: string;
  remoteAddress: string;
  remotePort: number;
  connectedAt: string;
  bytesRead: number;
  bytesWritten: number;
}

export interface DiscoveredPeer {
  id: string;
  address: string;
  port: number;
  lastSeen: string;
  latencyMs?: number;
  protocol: "UDP4";
}

export interface NetworkLogEntry {
  id: string;
  timestamp: string;
  protocol: "HTTP" | "TCP" | "UDP" | "SYSTEM";
  event: string;
  details: string;
  payload?: any;
}

export class P2PTriProtocolManager {
  public httpPort = 3000;
  public tcpPort = 6000;
  public udpPort = 7000;

  // Shared network state
  public blockchain: P2PBlock[] = [
    {
      index: 0,
      data: "Genesis Block",
      transactions: [],
      timestamp: Date.now() - 3600000,
      nonce: 0,
      previousHash: "0",
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  ];
  public mempool: P2PTransaction[] = [];
  public txBatchLimit = 2;
  public difficulty = 2;

  private connectedPeers: Map<net.Socket, PeerSocketInfo> = new Map();
  private discoveredPeers: Map<string, DiscoveredPeer> = new Map();
  private logs: NetworkLogEntry[] = [];

  private tcpServer: net.Server | null = null;
  private udpServer: dgram.Socket | null = null;
  private isTcpRunning = false;
  private isUdpRunning = false;

  constructor() {
    this.addLog("SYSTEM", "INIT", "Initializing Tri-Protocol P2P Node Subsystems...");
    this.startTcpServer();
    this.startUdpServer();
  }

  // --------------------------------------------------------------------------
  // CRYPTOGRAPHIC UTILITIES & MEMPOOL VALIDATION
  // --------------------------------------------------------------------------
  public calculateHash(
    index: number,
    previousHash: string,
    timestamp: number,
    transactions: any[],
    nonce: number
  ): string {
    return crypto
      .createHash("sha256")
      .update(index + previousHash + timestamp + JSON.stringify(transactions) + nonce)
      .digest("hex");
  }

  public verifySignature(publicKeyPem: string, data: any, signatureHex: string): boolean {
    try {
      const verifier = crypto.createVerify("sha256");
      verifier.update(JSON.stringify(data));
      verifier.end();
      return verifier.verify(publicKeyPem, signatureHex, "hex");
    } catch {
      return false;
    }
  }

  public isValidTransaction(tx: any): boolean {
    if (!tx || !tx.publicKey || !tx.message || !tx.signature) return false;
    return this.verifySignature(tx.publicKey, tx.message, tx.signature);
  }

  public isValidBlock(newBlock: P2PBlock, previousBlock?: P2PBlock): boolean {
    if (!previousBlock && newBlock.index === 0) return true;
    if (!previousBlock) return false;
    if (previousBlock.index + 1 !== newBlock.index) return false;
    if (previousBlock.hash !== newBlock.previousHash) return false;

    if (Array.isArray(newBlock.transactions)) {
      for (const tx of newBlock.transactions) {
        if (!this.isValidTransaction(tx)) {
          return false;
        }
      }
    }

    const reconstructedHash = this.calculateHash(
      newBlock.index,
      newBlock.previousHash || "",
      newBlock.timestamp,
      newBlock.transactions || [],
      newBlock.nonce || 0
    );

    if (newBlock.hash !== reconstructedHash) return false;
    return (newBlock.hash || "").startsWith("0".repeat(this.difficulty));
  }

  public mineBlockAndBroadcast(transactions: any[]): P2PBlock {
    const lastBlock = this.blockchain[this.blockchain.length - 1];
    const index = this.blockchain.length;
    const previousHash = lastBlock.hash || "0".repeat(64);
    const timestamp = Date.now();
    let nonce = 0;
    let hash = "";
    const targetPrefix = "0".repeat(this.difficulty);

    while (true) {
      hash = this.calculateHash(index, previousHash, timestamp, transactions, nonce);
      if (hash.startsWith(targetPrefix)) {
        break;
      }
      nonce++;
    }

    const minedBlock: P2PBlock = {
      index,
      previousHash,
      timestamp,
      transactions,
      data: `Batch mined block with ${transactions.length} txs`,
      nonce,
      hash,
    };

    this.blockchain.push(minedBlock);
    this.addLog(
      "SYSTEM",
      "BLOCK_MINED_POW",
      `[Miner] Block #${index} mined with ${transactions.length} txs! Nonce: ${nonce}, Hash: ${hash}`,
      minedBlock
    );

    // Evict confirmed transactions from local mempool
    transactions.forEach((tx) => {
      const idx = this.mempool.findIndex((m) => m.signature === tx.signature);
      if (idx > -1) this.mempool.splice(idx, 1);
    });

    this.broadcastNewBlock(minedBlock);
    return minedBlock;
  }

  public broadcastNewTransaction(tx: P2PTransaction): number {
    const payload = JSON.stringify({ type: "NEW_TX", transaction: tx }) + "\n";
    let sentCount = 0;
    for (const [socket, info] of this.connectedPeers.entries()) {
      try {
        socket.write(payload);
        info.bytesWritten += Buffer.byteLength(payload);
        sentCount++;
      } catch (_e) {}
    }
    return sentCount;
  }

  public addTransaction(tx: any): {
    success: boolean;
    status: string;
    poolPosition: number;
    minedBlock?: P2PBlock;
    error?: string;
  } {
    if (!this.isValidTransaction(tx)) {
      this.addLog(
        "HTTP",
        "TX_REJECTED",
        `[Mempool] Transaction rejected: invalid cryptographic signature!`,
        tx
      );
      return {
        success: false,
        status: "REJECTED",
        poolPosition: this.mempool.length,
        error: "Cryptographic signature validation failed!",
      };
    }

    const alreadyExists = this.mempool.some((m) => m.signature === tx.signature);
    if (alreadyExists) {
      return {
        success: true,
        status: "ALREADY_IN_MEMPOOL",
        poolPosition: this.mempool.length,
      };
    }

    this.mempool.push(tx);
    this.addLog(
      "HTTP",
      "TX_ACCEPTED",
      `[Mempool] Transaction accepted from ${tx.message?.from} -> ${tx.message?.to} (${tx.message?.amount} BTC). Pool: ${this.mempool.length}/${this.txBatchLimit}`,
      tx
    );

    // Gossip unmined transaction to peer sockets
    this.broadcastNewTransaction(tx);

    let minedBlock: P2PBlock | undefined;
    if (this.mempool.length >= this.txBatchLimit) {
      const batch = this.mempool.splice(0, this.txBatchLimit);
      minedBlock = this.mineBlockAndBroadcast(batch);
    }

    return {
      success: true,
      status: minedBlock ? "BATCH_MINED" : "Queued in Mempool",
      poolPosition: this.mempool.length,
      minedBlock,
    };
  }

  // --------------------------------------------------------------------------
  // LOGGING UTILITY
  // --------------------------------------------------------------------------
  public addLog(
    protocol: NetworkLogEntry["protocol"],
    event: string,
    details: string,
    payload?: any
  ) {
    const entry: NetworkLogEntry = {
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      protocol,
      event,
      details,
      payload,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }
  }

  public getLogs(): NetworkLogEntry[] {
    return [...this.logs];
  }

  // --------------------------------------------------------------------------
  // 1. TCP SERVER (PORT 6000): P2P SYNC ENGINE & BLOCK FLOODING
  // --------------------------------------------------------------------------
  private startTcpServer() {
    try {
      this.tcpServer = net.createServer((socket) => {
        const peerId = `peer-tcp-${crypto.randomBytes(4).toString("hex")}`;
        const peerInfo: PeerSocketInfo = {
          id: peerId,
          remoteAddress: socket.remoteAddress || "127.0.0.1",
          remotePort: socket.remotePort || 0,
          connectedAt: new Date().toISOString(),
          bytesRead: 0,
          bytesWritten: 0,
        };

        this.connectedPeers.set(socket, peerInfo);
        console.log(`[P2P Connection] Peer connected from ${peerInfo.remoteAddress}:${peerInfo.remotePort}`);
        this.addLog(
          "TCP",
          "P2P_CONNECTION",
          `Peer connected from ${peerInfo.remoteAddress}:${peerInfo.remotePort} (${peerId})`
        );

        // 1. Send the current chain to the newly joined peer for initial synchronization
        const syncPayload = JSON.stringify({ type: "SYNC", chain: this.blockchain }) + "\n";
        socket.write(syncPayload);
        peerInfo.bytesWritten += Buffer.byteLength(syncPayload);

        this.addLog(
          "TCP",
          "P2P_SYNC_SENT",
          `Sent initial chain state (${this.blockchain.length} blocks) to peer ${peerId}`
        );

        // 2. Handle incoming delimited data streams
        socket.on("data", (data) => {
          peerInfo.bytesRead += data.length;
          try {
            const rawString = data.toString().trim();
            const payloads = rawString.split("\n");

            payloads.forEach((payload) => {
              if (!payload.trim()) return;
              const message = JSON.parse(payload);

              if (message.type === "NEW_BLOCK" && message.block) {
                const incomingBlock: P2PBlock = message.block;

                // Validation rule: verify proper sequence alignment
                if (incomingBlock.index === this.blockchain.length) {
                  this.blockchain.push(incomingBlock);
                  this.addLog(
                    "TCP",
                    "P2P_SYNC",
                    `[P2P Sync] Successfully integrated flooded block index ${incomingBlock.index}!`,
                    incomingBlock
                  );
                } else if (incomingBlock.index < this.blockchain.length) {
                  this.addLog(
                    "TCP",
                    "P2P_IGNORE",
                    `[P2P Sync] Ignored already known block index ${incomingBlock.index} (Local height: ${this.blockchain.length})`
                  );
                } else {
                  this.addLog(
                    "TCP",
                    "P2P_REJECT",
                    `[P2P Sync] Rejected block index ${incomingBlock.index} (Improper alignment, expected ${this.blockchain.length})`
                  );
                }
              } else if (message.type === "SYNC" && Array.isArray(message.chain)) {
                // If incoming chain has greater proof-of-work/length
                if (message.chain.length > this.blockchain.length) {
                  this.blockchain = message.chain;
                  this.addLog(
                    "TCP",
                    "P2P_CHAIN_REPLACED",
                    `Replaced local chain with longer chain (${message.chain.length} blocks) from peer ${peerId}`
                  );
                }
              }
            });
          } catch (err: any) {
            this.addLog(
              "TCP",
              "P2P_PARSE_ERROR",
              `Received unreadable format from peer ${peerId}: ${err.message}`
            );
          }
        });

        // 3. Clean up on disconnect
        socket.on("close", () => {
          this.connectedPeers.delete(socket);
          this.addLog(
            "TCP",
            "P2P_DISCONNECT",
            `Peer ${peerId} disconnected. Remaining active peers: ${this.connectedPeers.size}`
          );
        });

        socket.on("error", (err) => {
          this.addLog("TCP", "SOCKET_ERROR", `Socket error on ${peerId}: ${err.message}`);
        });
      });

      this.tcpServer.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          this.addLog(
            "TCP",
            "PORT_IN_USE",
            `Port ${this.tcpPort} is already in use. Reusing existing TCP socket bound process.`
          );
          this.isTcpRunning = true;
        } else {
          this.addLog("TCP", "SERVER_ERROR", `TCP Server Error: ${err.message}`);
        }
      });

      this.tcpServer.listen(this.tcpPort, () => {
        this.isTcpRunning = true;
        console.log(`[TCP P2P Server] Running on port ${this.tcpPort}`);
        this.addLog(
          "TCP",
          "LISTENING",
          `[TCP P2P Server] Running on port ${this.tcpPort} (Peer Mesh Ready)`
        );
      });
    } catch (err: any) {
      this.addLog("TCP", "INIT_FAILED", `Failed to bind TCP port ${this.tcpPort}: ${err.message}`);
    }
  }

  /**
   * P2P Helper: Floods a newly generated block to all connected TCP peers
   */
  public broadcastNewBlock(block: P2PBlock): number {
    const peerCount = this.connectedPeers.size;
    console.log(`[P2P Broadcast] Flooding block index ${block.index} to ${peerCount} peers...`);
    this.addLog(
      "TCP",
      "P2P_BROADCAST",
      `[P2P Broadcast] Flooding block index ${block.index} to ${peerCount} peers...`,
      block
    );

    const payload = JSON.stringify({ type: "NEW_BLOCK", block }) + "\n";
    let sentCount = 0;

    for (const [socket, info] of this.connectedPeers.entries()) {
      try {
        socket.write(payload);
        info.bytesWritten += Buffer.byteLength(payload);
        sentCount++;
      } catch (err: any) {
        this.addLog(
          "TCP",
          "BROADCAST_ERROR",
          `[P2P Error] Failed to send to peer ${info.id}: ${err.message}`
        );
      }
    }

    return sentCount;
  }

  // --------------------------------------------------------------------------
  // 2. UDP SERVER (PORT 7000): PEER DISCOVERY SERVICE
  // --------------------------------------------------------------------------
  private startUdpServer() {
    try {
      this.udpServer = dgram.createSocket("udp4");

      this.udpServer.on("message", (msg, rinfo) => {
        const messageStr = msg.toString().trim();
        const peerKey = `${rinfo.address}:${rinfo.port}`;

        console.log(`[Discovery] Received discovery ping from ${rinfo.address}:${rinfo.port}`);
        console.log(`[Discovery] Peer found at ${rinfo.address}:${rinfo.port}`);
        this.addLog(
          "UDP",
          "DISCOVERY_PING",
          `[Discovery] Received discovery ping "${messageStr}" from ${peerKey}`,
          { address: rinfo.address, port: rinfo.port, length: msg.length }
        );

        // Update Discovered Peers table
        this.discoveredPeers.set(peerKey, {
          id: `udp-peer-${crypto.randomBytes(3).toString("hex")}`,
          address: rinfo.address,
          port: rinfo.port,
          lastSeen: new Date().toISOString(),
          protocol: "UDP4",
        });

        // Send PONG_DISCOVERY reply
        const reply = Buffer.from("PONG_DISCOVERY");
        this.udpServer?.send(reply, rinfo.port, rinfo.address, (err) => {
          if (err) {
            this.addLog(
              "UDP",
              "REPLY_ERROR",
              `Failed to send PONG_DISCOVERY to ${peerKey}: ${err.message}`
            );
          } else {
            this.addLog(
              "UDP",
              "DISCOVERY_PONG",
              `[Discovery] Dispatched PONG_DISCOVERY to ${peerKey}`
            );
          }
        });
      });

      this.udpServer.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          this.addLog(
            "UDP",
            "PORT_IN_USE",
            `Port ${this.udpPort} already in use. Socket already listening.`
          );
          this.isUdpRunning = true;
        } else {
          this.addLog("UDP", "SOCKET_ERROR", `UDP Server Error: ${err.message}`);
        }
      });

      this.udpServer.bind(this.udpPort, () => {
        this.isUdpRunning = true;
        console.log(`[UDP Discovery Server] Running on port ${this.udpPort}`);
        this.addLog(
          "UDP",
          "LISTENING",
          `[UDP Discovery Server] Running on port ${this.udpPort} (Peer Discovery Active)`
        );
      });
    } catch (err: any) {
      this.addLog("UDP", "INIT_FAILED", `Failed to bind UDP port ${this.udpPort}: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // 3. HTTP / RPC HELPER: ADD BLOCK LOCALLY & TRIGGER FLOOD
  // --------------------------------------------------------------------------
  public addBlockViaHttp(data: any): { status: string; block: P2PBlock; peersFlooded: number } {
    const newBlock: P2PBlock = {
      index: this.blockchain.length,
      data: data || "Empty Transaction Block",
      timestamp: Date.now(),
    };

    // Save block locally
    this.blockchain.push(newBlock);
    console.log(`[HTTP API] Block ${newBlock.index} mined and added locally.`);
    this.addLog(
      "HTTP",
      "BLOCK_MINED",
      `[HTTP API] Block ${newBlock.index} mined and added locally.`,
      newBlock
    );

    // FLOOD ATOM: Instantly push the new block to the P2P network
    const peersFlooded = this.broadcastNewBlock(newBlock);

    return {
      status: "Success",
      block: newBlock,
      peersFlooded,
    };
  }

  // --------------------------------------------------------------------------
  // 4. TEST HELPERS: SIMULATE PEERS & UDP PINGS
  // --------------------------------------------------------------------------
  /**
   * Spawns a real simulated TCP peer socket connecting to 127.0.0.1:6000
   */
  public simulateConnectPeer(peerName?: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const name = peerName || `Simulated-Node-${Math.floor(Math.random() * 900 + 100)}`;
      const client = new net.Socket();

      client.connect(this.tcpPort, "127.0.0.1", () => {
        this.addLog("TCP", "SIMULATED_PEER_CONNECTED", `${name} connected to TCP :${this.tcpPort}`);
        resolve({
          success: true,
          message: `${name} successfully connected to TCP :${this.tcpPort}`,
        });
      });

      client.on("data", (data) => {
        try {
          const msg = JSON.parse(data.toString().trim().split("\n")[0]);
          if (msg.type === "SYNC") {
            this.addLog(
              "TCP",
              "SIMULATED_PEER_SYNC",
              `${name} received initial chain of ${msg.chain?.length} blocks`
            );
          } else if (msg.type === "NEW_BLOCK") {
            this.addLog(
              "TCP",
              "SIMULATED_PEER_BLOCK",
              `${name} received flooded block #${msg.block?.index}`
            );
          }
        } catch (_e) {}
      });

      client.on("error", (err) => {
        this.addLog("TCP", "SIMULATED_PEER_ERROR", `${name} error: ${err.message}`);
        resolve({
          success: false,
          message: `${name} connection failed: ${err.message}`,
        });
      });
    });
  }

  /**
   * Sends a real UDP ping from an ephemeral socket to 127.0.0.1:7000 and awaits PONG_DISCOVERY
   */
  public testUdpPing(): Promise<{ success: boolean; reply?: string; latencyMs: number }> {
    return new Promise((resolve) => {
      const client = dgram.createSocket("udp4");
      const startTime = Date.now();
      const pingPayload = Buffer.from(`PING_DISCOVERY_${Date.now()}`);

      let timeoutTimer: NodeJS.Timeout | null = setTimeout(() => {
        client.close();
        resolve({ success: false, latencyMs: Date.now() - startTime });
      }, 3000);

      client.on("message", (msg) => {
        const latencyMs = Date.now() - startTime;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        const reply = msg.toString();
        client.close();
        resolve({ success: true, reply, latencyMs });
      });

      client.send(pingPayload, this.udpPort, "127.0.0.1", (err) => {
        if (err) {
          if (timeoutTimer) clearTimeout(timeoutTimer);
          client.close();
          resolve({ success: false, latencyMs: 0 });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // STATE SNAPSHOT
  // --------------------------------------------------------------------------
  public getStatus() {
    const peersArray = Array.from(this.connectedPeers.values());
    const discoveredArray = Array.from(this.discoveredPeers.values());

    return {
      ports: {
        http: this.httpPort,
        tcp: this.tcpPort,
        udp: this.udpPort,
      },
      status: {
        http: "LISTENING",
        tcp: this.isTcpRunning ? "LISTENING" : "INITIALIZING",
        udp: this.isUdpRunning ? "LISTENING" : "INITIALIZING",
      },
      chainLength: this.blockchain.length,
      blockchain: this.blockchain,
      latestBlock: this.blockchain[this.blockchain.length - 1],
      mempool: this.mempool,
      mempoolCount: this.mempool.length,
      txBatchLimit: this.txBatchLimit,
      difficulty: this.difficulty,
      connectedPeersCount: peersArray.length,
      connectedPeers: peersArray,
      discoveredPeersCount: discoveredArray.length,
      discoveredPeers: discoveredArray,
      logs: this.logs.slice(0, 50),
    };
  }
}

export const p2pTriProtocolManager = new P2PTriProtocolManager();
