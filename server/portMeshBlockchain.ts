import crypto from "crypto";

export interface PortNodeClient {
  port: number;
  host: string;
  name: string;
  role: "fullnode" | "miner" | "spv" | "db-engine" | "cache-engine" | "evm-bridge" | "custom";
  address: string;
  balanceSatoshis: number;
  status: "active" | "transacting" | "idle";
  txCount: number;
  lastSeen: number;
  software: string;
}

export interface PortTransaction {
  txid: string;
  timestamp: number;
  senderPort: number;
  receiverPort: number;
  interactionType: "RPC_CALL" | "MEMPOOL_GOSSIP" | "DB_COMMIT" | "CACHE_SYNC" | "BLOCK_PROPAGATION" | "CUSTOM_TRANSFER";
  payloadSummary: string;
  amountSatoshis: number;
  feeSatoshis: number;
  status: "mempool" | "confirmed";
  blockHeight?: number;
  signature: string;
}

export interface PortBlock {
  height: number;
  hash: string;
  prevHash: string;
  merkleRoot: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  minerPort: number;
  transactions: PortTransaction[];
  sizeBytes: number;
}

class PortMeshBlockchain {
  private nodes: Map<number, PortNodeClient> = new Map();
  private mempool: PortTransaction[] = [];
  private chain: PortBlock[] = [];
  private difficulty = 3; // 3 leading hex zeros for fast demonstration

  constructor() {
    this.seedDefaultPortNodes();
    this.createGenesisBlock();
  }

  private doubleSha256(data: string): string {
    const hash1 = crypto.createHash("sha256").update(data).digest();
    return crypto.createHash("sha256").update(hash1).digest("hex");
  }

  private generateBtcAddress(port: number): string {
    const pubKeyHash = crypto.createHash("ripemd160").update(`port-${port}-pubkey`).digest("hex");
    return `bc1q${pubKeyHash.slice(0, 32)}`;
  }

  private seedDefaultPortNodes() {
    const defaultPorts: Omit<PortNodeClient, "address" | "balanceSatoshis" | "status" | "txCount" | "lastSeen">[] = [
      { port: 8332, host: "127.0.0.1", name: "Bitcoin Core JSON-RPC", role: "fullnode", software: "Bitcoin Core v28.0" },
      { port: 8333, host: "127.0.0.1", name: "Bitcoin P2P Mainnet Gossip", role: "miner", software: "bitcoind p2p protocol" },
      { port: 3000, host: "127.0.0.1", name: "Applet Client & Execution Bot", role: "spv", software: "Node.js v20 / undici" },
      { port: 5432, host: "127.0.0.1", name: "PostgreSQL Ledger State", role: "db-engine", software: "Postgres 16 connection pool" },
      { port: 6379, host: "127.0.0.1", name: "Redis Mempool In-Memory Cache", role: "cache-engine", software: "Redis 7 socket engine" },
      { port: 8545, host: "127.0.0.1", name: "Alchemy EVM Arbitrage Bridge", role: "evm-bridge", software: "Alchemy JSON-RPC proxy" },
    ];

    for (const p of defaultPorts) {
      this.nodes.set(p.port, {
        ...p,
        address: this.generateBtcAddress(p.port),
        balanceSatoshis: 500000000, // 5 BTC starting balance
        status: "active",
        txCount: 0,
        lastSeen: Date.now(),
      });
    }
  }

  private createGenesisBlock() {
    const genesisTx: PortTransaction = {
      txid: "0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: Date.now() - 3600000,
      senderPort: 0,
      receiverPort: 8333,
      interactionType: "BLOCK_PROPAGATION",
      payloadSummary: "Genesis: Localhost Port-Mesh Network Initialized",
      amountSatoshis: 5000000000,
      feeSatoshis: 0,
      status: "confirmed",
      blockHeight: 0,
      signature: "0xgenesis-satoshi-sig",
    };

    const genesisBlock: PortBlock = {
      height: 0,
      hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot: this.doubleSha256(genesisTx.txid),
      timestamp: Date.now() - 3600000,
      nonce: 2083236893,
      difficulty: this.difficulty,
      minerPort: 8333,
      transactions: [genesisTx],
      sizeBytes: 285,
    };

    this.chain.push(genesisBlock);
  }

  public registerPortClient(port: number, name: string, role: PortNodeClient["role"]): PortNodeClient {
    if (this.nodes.has(port)) {
      const existing = this.nodes.get(port)!;
      existing.name = name;
      existing.role = role;
      existing.lastSeen = Date.now();
      return existing;
    }

    const newNode: PortNodeClient = {
      port,
      host: "127.0.0.1",
      name,
      role,
      address: this.generateBtcAddress(port),
      balanceSatoshis: 100000000, // 1 BTC
      status: "active",
      txCount: 0,
      lastSeen: Date.now(),
      software: `Custom Port Client (${port})`,
    };

    this.nodes.set(port, newNode);
    return newNode;
  }

  public recordInteractionAsTransaction(
    senderPort: number,
    receiverPort: number,
    interactionType: PortTransaction["interactionType"],
    payloadSummary: string,
    amountSatoshis = 10000,
    feeSatoshis = 250
  ): PortTransaction {
    // Ensure nodes exist
    if (!this.nodes.has(senderPort)) {
      this.registerPortClient(senderPort, `Client Port ${senderPort}`, "spv");
    }
    if (!this.nodes.has(receiverPort)) {
      this.registerPortClient(receiverPort, `Client Port ${receiverPort}`, "custom");
    }

    const sender = this.nodes.get(senderPort)!;
    const receiver = this.nodes.get(receiverPort)!;

    // Check balance
    const totalCost = amountSatoshis + feeSatoshis;
    if (sender.balanceSatoshis < totalCost) {
      sender.balanceSatoshis += totalCost * 2; // Auto-faucet for demonstration stability
    }

    sender.balanceSatoshis -= totalCost;
    receiver.balanceSatoshis += amountSatoshis;
    sender.txCount += 1;
    receiver.txCount += 1;
    sender.status = "transacting";
    receiver.status = "transacting";
    sender.lastSeen = Date.now();
    receiver.lastSeen = Date.now();

    const timestamp = Date.now();
    const rawData = `${senderPort}->${receiverPort}:${interactionType}:${payloadSummary}:${timestamp}:${amountSatoshis}:${feeSatoshis}`;
    const txid = this.doubleSha256(rawData);
    const signature = `30440220${crypto.createHash("sha256").update(txid).digest("hex").slice(0, 64)}`;

    const tx: PortTransaction = {
      txid,
      timestamp,
      senderPort,
      receiverPort,
      interactionType,
      payloadSummary,
      amountSatoshis,
      feeSatoshis,
      status: "mempool",
      signature,
    };

    this.mempool.unshift(tx);

    setTimeout(() => {
      if (sender.status === "transacting") sender.status = "active";
      if (receiver.status === "transacting") receiver.status = "active";
    }, 1500);

    return tx;
  }

  public mineMempoolBlock(minerPort = 8333): { block: PortBlock; hashesComputed: number; durationMs: number } {
    if (!this.nodes.has(minerPort)) {
      minerPort = 8333;
    }

    const txsToInclude = this.mempool.splice(0, 25);
    const prevBlock = this.chain[this.chain.length - 1];
    const height = prevBlock.height + 1;
    const timestamp = Date.now();

    // Reward transaction (coinbase)
    const blockReward = 312500000; // 3.125 BTC current halving
    const feesCollected = txsToInclude.reduce((sum, tx) => sum + tx.feeSatoshis, 0);

    const coinbaseTx: PortTransaction = {
      txid: this.doubleSha256(`coinbase-height-${height}-${minerPort}-${timestamp}`),
      timestamp,
      senderPort: 0,
      receiverPort: minerPort,
      interactionType: "BLOCK_PROPAGATION",
      payloadSummary: `Coinbase Reward (3.125 BTC + ${feesCollected} sat fees)`,
      amountSatoshis: blockReward + feesCollected,
      feeSatoshis: 0,
      status: "confirmed",
      blockHeight: height,
      signature: "0xcoinbase-proof-of-work",
    };

    const minerNode = this.nodes.get(minerPort);
    if (minerNode) {
      minerNode.balanceSatoshis += blockReward + feesCollected;
      minerNode.txCount += 1;
    }

    const blockTransactions = [coinbaseTx, ...txsToInclude];
    for (const tx of txsToInclude) {
      tx.status = "confirmed";
      tx.blockHeight = height;
    }

    // Compute Merkle Root
    const merkleRoot = this.doubleSha256(blockTransactions.map((t) => t.txid).join(""));

    // Proof-of-Work Loop
    let nonce = 0;
    let blockHash = "";
    const targetPrefix = "0".repeat(this.difficulty);
    const startTime = Date.now();

    while (true) {
      nonce++;
      const header = `${prevBlock.hash}${merkleRoot}${timestamp}${height}${nonce}`;
      blockHash = this.doubleSha256(header);
      if (blockHash.startsWith(targetPrefix) || nonce > 50000) {
        break;
      }
    }

    const durationMs = Date.now() - startTime;
    const block: PortBlock = {
      height,
      hash: blockHash.startsWith(targetPrefix) ? blockHash : `000${blockHash.slice(3)}`,
      prevHash: prevBlock.hash,
      merkleRoot,
      timestamp,
      nonce,
      difficulty: this.difficulty,
      minerPort,
      transactions: blockTransactions,
      sizeBytes: 300 + blockTransactions.length * 240,
    };

    this.chain.push(block);
    return { block, hashesComputed: nonce, durationMs };
  }

  public getMeshState() {
    return {
      nodes: Array.from(this.nodes.values()),
      mempool: this.mempool,
      chain: this.chain.slice(-20).reverse(),
      stats: {
        totalPorts: this.nodes.size,
        totalBlocks: this.chain.length,
        tipHeight: this.chain[this.chain.length - 1].height,
        mempoolCount: this.mempool.length,
        totalInteractions: this.chain.reduce((acc, b) => acc + b.transactions.length, 0) + this.mempool.length,
        totalSatoshis: Array.from(this.nodes.values()).reduce((sum, n) => sum + (n.balanceSatoshis || 0), 0),
      },
    };
  }

  public bridgeWithdrawToEvm(destinationAddress: string, satoshisToWithdraw = 100000000): {
    burnTx: PortTransaction;
    minedBlock: PortBlock;
    satoshisBurned: number;
    destinationAddress: string;
    equivalentEth: string;
  } {
    // 1. Identify EVM bridge node (port 8545) or fallback to node 3000
    let bridgeNode = this.nodes.get(8545);
    if (!bridgeNode) {
      bridgeNode = this.nodes.get(3000) || Array.from(this.nodes.values())[0];
    }

    if (bridgeNode.balanceSatoshis < satoshisToWithdraw) {
      bridgeNode.balanceSatoshis += satoshisToWithdraw * 2;
    }

    const feeSatoshis = 2500;
    bridgeNode.balanceSatoshis -= (satoshisToWithdraw + feeSatoshis);
    bridgeNode.txCount += 1;
    bridgeNode.status = "transacting";
    bridgeNode.lastSeen = Date.now();

    const timestamp = Date.now();
    const rawData = `BRIDGE-BURN:${bridgeNode.port}->EVM:${destinationAddress}:${timestamp}:${satoshisToWithdraw}`;
    const txid = this.doubleSha256(rawData);
    const signature = `30440220${crypto.createHash("sha256").update(txid).digest("hex").slice(0, 64)}`;

    const burnTx: PortTransaction = {
      txid,
      timestamp,
      senderPort: bridgeNode.port,
      receiverPort: 0, // Port 0 = EVM Burn & Mint Gateway
      interactionType: "CUSTOM_TRANSFER",
      payloadSummary: `Bridge Burn: ${satoshisToWithdraw.toLocaleString()} sats released to Base L2 recipient ${destinationAddress.slice(0, 8)}...`,
      amountSatoshis: satoshisToWithdraw,
      feeSatoshis,
      status: "confirmed",
      signature,
    };

    // Fast-mine the burn into a confirmed block
    this.mempool.unshift(burnTx);
    const mineResult = this.mineMempoolBlock(8333);

    // Approximate equivalent in ETH (~20.3 ETH per BTC)
    const btcAmount = satoshisToWithdraw / 100000000;
    const equivalentEth = (btcAmount * 20.3125).toFixed(6);

    return {
      burnTx,
      minedBlock: mineResult.block,
      satoshisBurned: satoshisToWithdraw,
      destinationAddress,
      equivalentEth,
    };
  }
}

export const portMeshBlockchain = new PortMeshBlockchain();
