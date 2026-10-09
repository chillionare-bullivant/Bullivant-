import http from "http";
import net from "net";
import os from "os";
import { portMeshBlockchain, type PortNodeClient } from "./portMeshBlockchain.js";

export type PortProtocol = "HTTP" | "WebSocket" | "TCP" | "UDP" | "JSON-RPC" | "Postgres" | "Redis" | "gRPC";
export type PortCategory = "web" | "blockchain" | "p2p" | "database" | "cache" | "telemetry" | "custom";
export type PortStatus = "listening" | "active" | "standby" | "mesh-client";

export interface ProjectPortItem {
  id: string;
  port: number;
  name: string;
  protocol: PortProtocol;
  category: PortCategory;
  localUrl: string;
  proxyPath: string;
  description: string;
  role: string;
  status: PortStatus;
  curlCommand: string;
  tags: string[];
  subPath?: string;
  isNativeListener?: boolean;
}

const BUILT_IN_PORTS: ProjectPortItem[] = [
  {
    id: "port-3000-web",
    port: 3000,
    name: "Primary Applet Web UI & REST API Gateway",
    protocol: "HTTP",
    category: "web",
    localUrl: "http://localhost:3000",
    proxyPath: "/api/health",
    description: "Main Express + Vite fullstack gateway serving React frontend, REST endpoints, and controllers.",
    role: "Web Application & REST Gateway",
    status: "listening",
    curlCommand: "curl -i http://localhost:3000/api/health",
    tags: ["Vite", "Express", "REST", "Node.js v22", "SPA"],
    isNativeListener: true,
  },
  {
    id: "port-3000-pty",
    port: 3000,
    name: "PTY Web Terminal Interactive Stream",
    protocol: "WebSocket",
    category: "web",
    localUrl: "ws://localhost:3000/ws/terminal",
    proxyPath: "/ws/terminal",
    subPath: "/ws/terminal",
    description: "Bi-directional pseudo-terminal socket for interactive bash shell stream and real-time PTY session.",
    role: "PTY Terminal WebSocket",
    status: "listening",
    curlCommand: "wscat -c ws://localhost:3000/ws/terminal",
    tags: ["WebSocket", "xterm.js", "node-pty", "Shell"],
    isNativeListener: true,
  },
  {
    id: "port-3000-p2p",
    port: 3000,
    name: "P2P Network Gossip Event Stream",
    protocol: "WebSocket",
    category: "p2p",
    localUrl: "ws://localhost:3000/ws/p2p",
    proxyPath: "/ws/p2p",
    subPath: "/ws/p2p",
    description: "Real-time WebSocket event broadcaster for peer discovery, inventory gossip, and block flooding.",
    role: "P2P Real-time Event Socket",
    status: "listening",
    curlCommand: "wscat -c ws://localhost:3000/ws/p2p",
    tags: ["WebSocket", "P2P", "Gossip", "Broadcast"],
    isNativeListener: true,
  },
  {
    id: "port-8080-http",
    port: 8080,
    name: "Internal Native Node.js HTTP Server",
    protocol: "HTTP",
    category: "web",
    localUrl: "http://localhost:8080",
    proxyPath: "/api/proxy/8080",
    description: "Raw Node.js http.createServer instance running on port 8080, returning text/plain 'Hello World!'.",
    role: "Native Node.js Server",
    status: "listening",
    curlCommand: "curl -i http://localhost:8080/",
    tags: ["Native HTTP", "Hello World", "Zero Dependency", "Proxyable"],
    isNativeListener: true,
  },
  {
    id: "port-3333-stratum-v1",
    port: 3333,
    name: "Bitcoin Stratum V1 ASIC Mining Pool Protocol",
    protocol: "TCP",
    category: "blockchain",
    localUrl: "tcp://127.0.0.1:3333",
    proxyPath: "/api/stratum/state",
    description: "Stratum V1 mining pool protocol socket for physical ASIC miners (Antminer S19 Pro 110 TH/s). Supports mining.subscribe, mining.authorize, and mining.submit.",
    role: "Stratum V1 ASIC Mining Pool",
    status: "listening",
    curlCommand: "nc -vz 127.0.0.1 3333",
    tags: ["Stratum V1", "ASIC", "Antminer S19 Pro", "SHA-256d", "110 TH/s", "Mining Pool"],
    isNativeListener: true,
  },
  {
    id: "port-8332-btc-rpc",
    port: 8332,
    name: "Bitcoin Core Mainnet JSON-RPC Node",
    protocol: "JSON-RPC",
    category: "blockchain",
    localUrl: "http://127.0.0.1:8332",
    proxyPath: "/api/proxy/8332",
    description: "Bitcoin Core JSON-RPC 2.0 interface for getblockchaininfo, getblockcount, and raw transactions.",
    role: "BTC Full Node RPC",
    status: "listening",
    curlCommand: "curl -s -d '{\"jsonrpc\":\"1.0\",\"id\":\"probe\",\"method\":\"getblockchaininfo\",\"params\":[]}' -H 'content-type:text/plain;' http://127.0.0.1:8332/",
    tags: ["Bitcoin", "JSON-RPC", "Mainnet", "Core Node"],
  },
  {
    id: "port-8333-btc-gossip",
    port: 8333,
    name: "Bitcoin P2P Mainnet Gossip & Wire Protocol",
    protocol: "TCP",
    category: "blockchain",
    localUrl: "tcp://127.0.0.1:8333",
    proxyPath: "/api/proxy/8333",
    description: "Bitcoin peer-to-peer wire protocol socket for network gossip, inv, block, and transaction propagation.",
    role: "BTC P2P Gossip Miner",
    status: "active",
    curlCommand: "nc -vz 127.0.0.1 8333",
    tags: ["Bitcoin", "P2P", "Wire Protocol", "Mempool", "Mining"],
  },
  {
    id: "port-18332-testnet-rpc",
    port: 18332,
    name: "Bitcoin Testnet / Regtest JSON-RPC Node",
    protocol: "JSON-RPC",
    category: "blockchain",
    localUrl: "http://127.0.0.1:18332",
    proxyPath: "/api/proxy/18332",
    description: "Bitcoin testnet/regtest JSON-RPC endpoint for sandboxed zero-cost block generation and script testing.",
    role: "Testnet / Regtest RPC",
    status: "standby",
    curlCommand: "curl -s -d '{\"jsonrpc\":\"1.0\",\"id\":\"test\",\"method\":\"getnetworkinfo\",\"params\":[]}' http://127.0.0.1:18332/",
    tags: ["Bitcoin", "Testnet", "Regtest", "Sandbox"],
  },
  {
    id: "port-18333-testnet-p2p",
    port: 18333,
    name: "Bitcoin Testnet P2P Wire Protocol",
    protocol: "TCP",
    category: "blockchain",
    localUrl: "tcp://127.0.0.1:18333",
    proxyPath: "/api/proxy/18333",
    description: "Bitcoin testnet peer communication port for staging and consensus verification.",
    role: "Testnet Wire Socket",
    status: "standby",
    curlCommand: "nc -vz 127.0.0.1 18333",
    tags: ["Bitcoin", "P2P", "Testnet"],
  },
  {
    id: "port-6000-tcp-sync",
    port: 6000,
    name: "Tri-Protocol TCP P2P Block Sync Server",
    protocol: "TCP",
    category: "p2p",
    localUrl: "tcp://127.0.0.1:6000",
    proxyPath: "/api/proxy/6000",
    description: "High-speed raw TCP streaming socket for delimiter-framed block synchronization and inventory broadcast.",
    role: "P2P TCP Sync Engine",
    status: "listening",
    curlCommand: "nc 127.0.0.1 6000",
    tags: ["TCP", "Streaming", "P2P Sync", "Net Socket"],
    isNativeListener: true,
  },
  {
    id: "port-7000-udp-disc",
    port: 7000,
    name: "Tri-Protocol Decentralized UDP Peer Discovery",
    protocol: "UDP",
    category: "p2p",
    localUrl: "udp://127.0.0.1:7000",
    proxyPath: "/api/proxy/7000",
    description: "UDP datagram service answering PING_DISCOVERY with peer address and latency probes.",
    role: "UDP Peer Beacon",
    status: "listening",
    curlCommand: "echo -n 'PING_DISCOVERY' | nc -u -w1 127.0.0.1 7000",
    tags: ["UDP", "dgram", "Peer Discovery", "Zero-Config"],
    isNativeListener: true,
  },
  {
    id: "port-5432-postgres",
    port: 5432,
    name: "PostgreSQL Relational Ledger & UTXO State",
    protocol: "Postgres",
    category: "database",
    localUrl: "postgresql://postgres:postgres@127.0.0.1:5432/blockchain_db",
    proxyPath: "/api/proxy/5432",
    description: "Relational database server for ACID block indexation, UTXO sets, and row-level locked transactions.",
    role: "PostgreSQL DB Engine",
    status: "active",
    curlCommand: "pg_isready -h 127.0.0.1 -p 5432",
    tags: ["PostgreSQL", "ACID", "Row Locking", "UTXO", "Persistence"],
  },
  {
    id: "port-6379-redis",
    port: 6379,
    name: "Redis In-Memory Mempool & Pub/Sub Cache",
    protocol: "Redis",
    category: "cache",
    localUrl: "redis://127.0.0.1:6379/0",
    proxyPath: "/api/proxy/6379",
    description: "Ultra-low latency sub-millisecond cache for unconfirmed transactions and fast nonce tracking.",
    role: "Redis Cache Engine",
    status: "active",
    curlCommand: "redis-cli -h 127.0.0.1 -p 6379 ping",
    tags: ["Redis", "In-Memory", "Mempool", "Cache", "PubSub"],
  },
  {
    id: "port-8545-evm",
    port: 8545,
    name: "EVM Arbitrage Bridge & Web3 RPC Engine",
    protocol: "JSON-RPC",
    category: "blockchain",
    localUrl: "http://127.0.0.1:8545",
    proxyPath: "/api/proxy/8545",
    description: "Ethereum EVM JSON-RPC bridge for cross-chain arbitrage, DEX swaps, and flash loan simulation.",
    role: "EVM Bridge Client",
    status: "active",
    curlCommand: "curl -s -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' -H 'Content-Type: application/json' http://127.0.0.1:8545",
    tags: ["EVM", "Ethereum", "DEX", "Arbitrage", "JSON-RPC"],
  },
  {
    id: "port-9090-metrics",
    port: 9090,
    name: "Prometheus Metrics Exporter",
    protocol: "HTTP",
    category: "telemetry",
    localUrl: "http://127.0.0.1:9090/metrics",
    proxyPath: "/api/proxy/9090",
    description: "OpenMetrics scraping endpoint monitoring node TPS, block propagation delay, and CPU utilization.",
    role: "Prometheus Telemetry",
    status: "active",
    curlCommand: "curl -i http://127.0.0.1:9090/metrics",
    tags: ["Prometheus", "OpenMetrics", "Monitoring", "Telemetry"],
  },
  {
    id: "port-50051-grpc",
    port: 50051,
    name: "gRPC Microservice Consensus Interconnect",
    protocol: "gRPC",
    category: "telemetry",
    localUrl: "grpc://127.0.0.1:50051",
    proxyPath: "/api/proxy/50051",
    description: "High-performance Protobuf binary RPC channel for inter-node state validation.",
    role: "gRPC Microservice",
    status: "standby",
    curlCommand: "grpcurl -plaintext 127.0.0.1:50051 list",
    tags: ["gRPC", "Protobuf", "Binary Wire", "High Throughput"],
  },
  {
    id: "port-7777-external-bridge",
    port: 7777,
    name: "External Cold Storage Bridge & Reality Gateway",
    protocol: "HTTP",
    category: "blockchain",
    localUrl: "http://localhost:7777",
    proxyPath: "/api/proxy/7777",
    description: "Dedicated reality bridge port to fill in and bind external hardware wallets (Ledger, Trezor, Coldcard) and EVM/BTC cold addresses directly to automated profit sweeps.",
    role: "External Cold Storage Bridge",
    status: "listening",
    curlCommand: "curl -i -X POST http://localhost:7777/api/bridge/bind -H 'Content-Type: application/json' -d '{\"externalAddress\":\"0xYourRealColdAddress\"}'",
    tags: ["Bridge", "Cold Storage", "Hardware Wallet", "EVM", "Bitcoin", "Reality Link"],
    isNativeListener: true,
  },
];

class PortDirectoryManager {
  private customPorts: Map<number, ProjectPortItem> = new Map();
  private probeCache: Map<number, {
    timestamp: number;
    latencyMs: number;
    statusCode?: number;
    statusMessage?: string;
    isListening: boolean;
    responsePreview?: string;
  }> = new Map();

  constructor() {
    // Initial sync with BTC mesh
    this.syncWithBtcMesh();
  }

  private syncWithBtcMesh() {
    try {
      const meshState = portMeshBlockchain.getMeshState();
      for (const node of meshState.nodes) {
        if (!this.findPort(node.port)) {
          this.registerPort({
            port: node.port,
            name: node.name,
            protocol: "TCP",
            category: "blockchain",
            role: node.role,
            description: `Dynamic mesh node running ${node.software}`,
            tags: ["Port-as-Client", "BTC Mesh", node.role],
          });
        }
      }
    } catch (_err) {
      // Mesh might be initializing
    }
  }

  public findPort(port: number): ProjectPortItem | undefined {
    const custom = this.customPorts.get(port);
    if (custom) return custom;
    return BUILT_IN_PORTS.find((p) => p.port === port);
  }

  public registerPort(params: {
    port: number;
    name: string;
    protocol?: PortProtocol;
    category?: PortCategory;
    role?: string;
    description?: string;
    tags?: string[];
  }): ProjectPortItem {
    const port = Number(params.port);
    const protocol = params.protocol || "HTTP";
    const category = params.category || "custom";
    const role = params.role || "Custom Port Client";
    const name = params.name || `Port ${port} Service`;
    const description = params.description || `Custom port client registered on ${protocol}://${port}`;
    const tags = params.tags || ["Custom", protocol];

    let localUrl = `http://localhost:${port}`;
    if (protocol === "WebSocket") localUrl = `ws://localhost:${port}`;
    else if (protocol === "TCP") localUrl = `tcp://127.0.0.1:${port}`;
    else if (protocol === "UDP") localUrl = `udp://127.0.0.1:${port}`;
    else if (protocol === "Postgres") localUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/blockchain_db`;
    else if (protocol === "Redis") localUrl = `redis://127.0.0.1:${port}`;
    else if (protocol === "gRPC") localUrl = `grpc://127.0.0.1:${port}`;

    const item: ProjectPortItem = {
      id: `port-${port}-custom`,
      port,
      name,
      protocol,
      category,
      localUrl,
      proxyPath: `/api/proxy/${port}`,
      description,
      role,
      status: "active",
      curlCommand: `curl -i ${localUrl}`,
      tags,
    };

    this.customPorts.set(port, item);

    // Also register in Port-as-Client BTC Mesh
    try {
      portMeshBlockchain.registerPortClient(
        port,
        name,
        category === "database"
          ? "db-engine"
          : category === "cache"
          ? "cache-engine"
          : category === "blockchain"
          ? "fullnode"
          : "custom"
      );
    } catch (_e) {
      // Mesh registration fallback
    }

    return item;
  }

  public async probePort(port: number, protocol: PortProtocol = "HTTP"): Promise<{
    port: number;
    protocol: PortProtocol;
    isListening: boolean;
    latencyMs: number;
    statusCode?: number;
    statusMessage?: string;
    bannerOrBody?: string;
    localUrl: string;
    gatewayUrl: string;
    curlCommand: string;
    timestamp: number;
    error?: string;
  }> {
    const start = Date.now();
    const item = this.findPort(port);
    const localUrl = item ? item.localUrl : `http://localhost:${port}`;
    const curlCommand = item ? item.curlCommand : `curl -i http://localhost:${port}/`;
    const gatewayUrl = `/api/proxy/${port}`;

    if (protocol === "HTTP" || protocol === "JSON-RPC") {
      try {
        const probeResult = await new Promise<{
          isListening: boolean;
          latencyMs: number;
          statusCode?: number;
          statusMessage?: string;
          bannerOrBody?: string;
          error?: string;
        }>((resolve) => {
          const req = http.get(
            `http://127.0.0.1:${port}/`,
            { timeout: 750 },
            (res) => {
              let body = "";
              res.on("data", (chunk) => {
                body += chunk;
              });
              res.on("end", () => {
                resolve({
                  isListening: true,
                  latencyMs: Math.max(1, Date.now() - start),
                  statusCode: res.statusCode || 200,
                  statusMessage: res.statusMessage || "OK",
                  bannerOrBody: body.slice(0, 300) || `HTTP ${res.statusCode} ${res.statusMessage}`,
                });
              });
            }
          );

          req.on("error", (err: any) => {
            resolve({
              isListening: false,
              latencyMs: Math.max(1, Date.now() - start),
              error: err.code === "ECONNREFUSED" ? "Connection refused (Port offline/standby)" : err.message,
              bannerOrBody: `Service on port ${port} is currently in standby / inactive.`,
            });
          });

          req.on("timeout", () => {
            req.destroy();
            resolve({
              isListening: false,
              latencyMs: Date.now() - start,
              error: "HTTP probe connection timeout (750ms)",
            });
          });
        });

        this.probeCache.set(port, {
          timestamp: Date.now(),
          latencyMs: probeResult.latencyMs,
          statusCode: probeResult.statusCode,
          statusMessage: probeResult.statusMessage,
          isListening: probeResult.isListening,
          responsePreview: probeResult.bannerOrBody,
        });

        return {
          port,
          protocol,
          isListening: probeResult.isListening,
          latencyMs: probeResult.latencyMs,
          statusCode: probeResult.statusCode,
          statusMessage: probeResult.statusMessage,
          bannerOrBody: probeResult.bannerOrBody,
          localUrl,
          gatewayUrl,
          curlCommand,
          timestamp: Date.now(),
          error: probeResult.error,
        };
      } catch (err: any) {
        return {
          port,
          protocol,
          isListening: false,
          latencyMs: Date.now() - start,
          localUrl,
          gatewayUrl,
          curlCommand,
          timestamp: Date.now(),
          error: err.message,
        };
      }
    }

    // Socket probe for TCP, Postgres, Redis, gRPC, Wire
    try {
      const probeResult = await new Promise<{
        isListening: boolean;
        latencyMs: number;
        bannerOrBody?: string;
        error?: string;
      }>((resolve) => {
        const socket = net.createConnection(
          { port, host: "127.0.0.1", timeout: 600 },
          () => {
            const latency = Math.max(1, Date.now() - start);
            socket.destroy();
            resolve({
              isListening: true,
              latencyMs: latency,
              bannerOrBody: `TCP handshake established successfully on 127.0.0.1:${port}. Port is active and listening.`,
            });
          }
        );

        socket.on("error", (err: any) => {
          resolve({
            isListening: false,
            latencyMs: Math.max(1, Date.now() - start),
            error: err.code === "ECONNREFUSED" ? "Connection refused (Port offline/standby)" : err.message,
            bannerOrBody: `Socket on port ${port} is currently in standby / inactive.`,
          });
        });

        socket.on("timeout", () => {
          socket.destroy();
          resolve({
            isListening: false,
            latencyMs: Date.now() - start,
            error: "TCP socket probe timeout (600ms)",
          });
        });
      });

      this.probeCache.set(port, {
        timestamp: Date.now(),
        latencyMs: probeResult.latencyMs,
        isListening: probeResult.isListening,
        responsePreview: probeResult.bannerOrBody,
      });

      return {
        port,
        protocol,
        isListening: probeResult.isListening,
        latencyMs: probeResult.latencyMs,
        bannerOrBody: probeResult.bannerOrBody,
        localUrl,
        gatewayUrl,
        curlCommand,
        timestamp: Date.now(),
        error: probeResult.error,
      };
    } catch (err: any) {
      return {
        port,
        protocol,
        isListening: false,
        latencyMs: Date.now() - start,
        localUrl,
        gatewayUrl,
        curlCommand,
        timestamp: Date.now(),
        error: err.message,
      };
    }
  }

  public getAllPorts(origin: string = ""): any[] {
    const meshState = portMeshBlockchain.getMeshState();
    const meshNodesMap = new Map<number, PortNodeClient>(meshState.nodes.map((n) => [n.port, n]));

    const allItems: ProjectPortItem[] = [...BUILT_IN_PORTS];
    for (const custom of this.customPorts.values()) {
      if (!allItems.some((p) => p.port === custom.port)) {
        allItems.push(custom);
      }
    }

    return allItems.map((item) => {
      const meshNode = meshNodesMap.get(item.port);
      const cachedProbe = this.probeCache.get(item.port);

      // Compute Gateway URL based on origin
      const gatewayUrl = `${origin}${item.proxyPath}`;

      return {
        ...item,
        gatewayUrl,
        btcAddress: meshNode?.address || `bc1q${item.port}node${item.protocol.toLowerCase()}`,
        balanceSatoshis: meshNode?.balanceSatoshis ?? 100000000,
        txCount: meshNode?.txCount ?? 0,
        meshRole: meshNode?.role ?? item.role,
        lastProbe: cachedProbe,
      };
    });
  }

  public getSummary() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      activeServerPort: 3000,
      totalRegistered: BUILT_IN_PORTS.length + this.customPorts.size,
    };
  }
}

export const portDirectoryManager = new PortDirectoryManager();
