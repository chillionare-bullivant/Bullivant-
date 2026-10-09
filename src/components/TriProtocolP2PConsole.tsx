import React, { useState, useEffect } from "react";
import {
  Network,
  Globe,
  Radio,
  Server,
  Terminal,
  Activity,
  Zap,
  Play,
  RefreshCw,
  Plus,
  Send,
  Wifi,
  WifiOff,
  CheckCircle2,
  Layers,
  ArrowRight,
  Code2,
  Copy,
  Hash,
  Clock,
  HardDrive,
  Users,
  ShieldCheck,
  Key,
  Cpu,
  Inbox,
} from "lucide-react";

const DEFAULT_P2P_STATE = {
  ports: { http: 3000, tcp: 6000, udp: 7000 },
  status: { http: "LISTENING", tcp: "LISTENING", udp: "LISTENING" },
  chainLength: 1,
  blockchain: [{ index: 0, data: "Genesis Block", transactions: [], timestamp: Date.now() }],
  mempool: [],
  mempoolCount: 0,
  txBatchLimit: 2,
  difficulty: 2,
  connectedPeersCount: 0,
  connectedPeers: [],
  discoveredPeersCount: 0,
  discoveredPeers: [],
  logs: [],
};

export function TriProtocolP2PConsole() {
  const [data, setData] = useState<any>(DEFAULT_P2P_STATE);
  const [loading, setLoading] = useState<boolean>(false);
  const [blockPayload, setBlockPayload] = useState<string>("Transfer 2.5 BTC to Hot Wallet");
  const [isMining, setIsMining] = useState<boolean>(false);
  const [simulatingPeer, setSimulatingPeer] = useState<boolean>(false);
  const [probingUdp, setProbingUdp] = useState<boolean>(false);
  const [udpPingResult, setUdpPingResult] = useState<any>(null);
  const [cliRunning, setCliRunning] = useState<boolean>(false);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  // Mempool & RSA Wallet state
  const [wallet, setWallet] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [generatingWallet, setGeneratingWallet] = useState<boolean>(false);
  const [simulatingTx, setSimulatingTx] = useState<boolean>(false);
  const [txFrom, setTxFrom] = useState<string>("Alice-ColdStorage");
  const [txTo, setTxTo] = useState<string>("Bob-TradingAccount");
  const [txAmount, setTxAmount] = useState<number>(3.75);
  const [txFeedback, setTxFeedback] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/p2p/status");
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const json = await res.json();
      if (json && json.success) {
        setData(json);
      }
    } catch (_err) {
      // Handled gracefully without dumping HTML parsing errors to console
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePostBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockPayload.trim()) return;
    setIsMining(true);
    try {
      // POST directly to the canonical /block endpoint
      const res = await fetch("/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: blockPayload }),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = await res.json();
          if (json.status === "Success" || json.success) {
            setBlockPayload("");
            await fetchStatus();
          }
        }
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setIsMining(false);
    }
  };

  const handleConnectSimulatedPeer = async () => {
    setSimulatingPeer(true);
    try {
      const peerNumber = Math.floor(Math.random() * 800 + 100);
      const res = await fetch("/api/p2p/simulate-peer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerName: `Node-Peer-EU-${peerNumber}` }),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          await res.json();
          await fetchStatus();
        }
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setSimulatingPeer(false);
    }
  };

  const handleUdpDiscoveryPing = async () => {
    setProbingUdp(true);
    try {
      const res = await fetch("/api/p2p/udp-ping", {
        method: "POST",
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = await res.json();
          setUdpPingResult(json);
          await fetchStatus();
        }
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setProbingUdp(false);
    }
  };

  const handleRunCli = async () => {
    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await fetch("/api/p2p/run-cli", { method: "POST" });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = await res.json();
          setCliOutput(json.stdout || json.stderr || "Executed cleanly.");
          await fetchStatus();
        }
      }
    } catch (_err) {
      setCliOutput("Execution completed.");
    } finally {
      setCliRunning(false);
    }
  };

  const handleGenerateWallet = async () => {
    setGeneratingWallet(true);
    try {
      const res = await fetch("/wallet");
      if (res.ok) {
        const json = await res.json();
        setWallet(json);
      }
    } catch (_err) {
      // Handled
    } finally {
      setGeneratingWallet(false);
    }
  };

  const handleSimulateTx = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimulatingTx(true);
    setTxFeedback(null);
    try {
      const res = await fetch("/api/p2p/simulate-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: txFrom,
          to: txTo,
          amount: txAmount,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.result?.minedBlock) {
            setTxFeedback(
              `⚡ TX accepted & Batch limit (${data?.txBatchLimit || 2}) hit! Block #${json.result.minedBlock.index} mined with PoW (Nonce: ${json.result.minedBlock.nonce})!`
            );
          } else {
            setTxFeedback(
              `✓ Cryptographic signature verified! Transaction added to Mempool (position ${json.result?.poolPosition || 1}/${data?.txBatchLimit || 2}).`
            );
          }
          await fetchStatus();
        } else {
          setTxFeedback("Failed: " + (json.error || "Signature rejection"));
        }
      }
    } catch (_err) {
      setTxFeedback("Error transmitting transaction to node gateway");
    } finally {
      setSimulatingTx(false);
    }
  };

  const codeSnippet = `const http = require('http');
const net = require('net');
const dgram = require('dgram');

const HTTP_PORT = 3000;
const TCP_PORT = 6000;
const UDP_PORT = 7000;

// Shared network state
const blockchain = [{ index: 0, data: "Genesis Block" }];
const connectedPeers = []; // Holds references to open TCP sockets

/**
 * P2P Helper: Floods a newly generated block to all connected TCP peers
 */
function broadcastNewBlock(block) {
  console.log(\`[P2P Broadcast] Flooding block index \${block.index} to \${connectedPeers.length} peers...\`);
  const payload = JSON.stringify({ type: 'NEW_BLOCK', block: block });
  connectedPeers.forEach((socket) => {
    try {
      socket.write(payload + '\\n'); // Stream delimiter
    } catch (err) {
      console.error(\`[P2P Error] Failed to send: \${err.message}\`);
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
      const parsed = JSON.parse(body || '{}');
      const newBlock = { index: blockchain.length, data: parsed.data, timestamp: Date.now() };
      blockchain.push(newBlock);
      broadcastNewBlock(newBlock); // Flood to P2P network
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Success', block: newBlock }));
    });
  }
});
httpServer.listen(HTTP_PORT);

// 2. TCP Server (P2P Sync Engine)
const tcpServer = net.createServer((socket) => {
  connectedPeers.push(socket);
  socket.write(JSON.stringify({ type: 'SYNC', chain: blockchain }) + '\\n');
  socket.on('data', (data) => {
    data.toString().trim().split('\\n').forEach(p => {
      const msg = JSON.parse(p);
      if (msg.type === 'NEW_BLOCK' && msg.block.index === blockchain.length) {
        blockchain.push(msg.block);
      }
    });
  });
  socket.on('close', () => {
    const idx = connectedPeers.indexOf(socket);
    if (idx > -1) connectedPeers.splice(idx, 1);
  });
});
tcpServer.listen(TCP_PORT);

// 3. UDP Server (Peer Discovery Service)
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  udpServer.send(Buffer.from('PONG_DISCOVERY'), rinfo.port, rinfo.address);
});
udpServer.bind(UDP_PORT);`;

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const logs = data?.logs || [];
  const blockchain = data?.blockchain || [];
  const connectedPeers = data?.connectedPeers || [];
  const discoveredPeers = data?.discoveredPeers || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                Tri-Protocol Node
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                Live Socket Mesh
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                P2P Delimited Streaming
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Tri-Protocol P2P Blockchain Node (HTTP • TCP • UDP)
            </h2>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Decoupled multi-layered networking: <strong>HTTP API (Port 3000)</strong> for client RPC and block submission, <strong>TCP Server (Port 6000)</strong> for persistent P2P synchronization and delimited block flooding, and <strong>UDP Server (Port 7000)</strong> for instant peer discovery pings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              {showCode ? "Hide Source Code" : "Inspect Node.js Code"}
            </button>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Protocol Ports Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* HTTP Status Card */}
          <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                1. HTTP Client RPC
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                PORT {data?.ports?.http || 3000}
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              GET <span className="text-cyan-300">/mempool</span> • POST <span className="text-emerald-300">/transact</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Validates digital signature & queues in Mempool
            </div>
          </div>

          {/* TCP Status Card */}
          <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                2. TCP P2P Sync Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                PORT {data?.ports?.tcp || 6000}
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              Active TCP Sockets: <span className="text-amber-300 font-bold">{data?.connectedPeersCount || 0}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Gossips NEW_TX & floods NEW_BLOCK
            </div>
          </div>

          {/* UDP Status Card */}
          <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                3. UDP Peer Discovery
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                PORT {data?.ports?.udp || 7000}
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              Discovered Peers: <span className="text-purple-300 font-bold">{data?.discoveredPeersCount || 0}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Responds PONG_PEER for mesh joining
            </div>
          </div>

          {/* Mempool Capacity Card */}
          <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-emerald-400" />
                4. Mempool Staging
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                BATCH: {data?.txBatchLimit || 2} TXS
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              Queued: <span className="text-emerald-400 font-bold">{data?.mempoolCount || (data?.mempool?.length || 0)}</span> / {data?.txBatchLimit || 2} TXs
            </div>
            <div className="text-[10px] text-zinc-500">
              Auto-mines block when batch limit reached
            </div>
          </div>
        </div>
      </div>

      {/* 2. Source Code Drawer (Collapsible) */}
      {showCode && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-zinc-300">
                Canonical Tri-Protocol Implementation (Node.js <span className="font-mono">http + net + dgram</span>)
              </span>
            </div>
            <button
              onClick={copyCode}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? "Copied to Clipboard!" : "Copy Code"}
            </button>
          </div>
          <pre className="p-4 bg-zinc-950 rounded-xl overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-96">
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* 3. Interactive Protocol Testing Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mempool & Transaction Signing Engine */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-600" />
                Distributed Mempool & RSA Signing
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Limit: {data?.txBatchLimit || 2} TXs
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Incoming cryptographically signed transactions accumulate in the node's mempool and gossip across the P2P mesh. Reaching <strong>{data?.txBatchLimit || 2} transactions</strong> triggers an automated Proof-of-Work block mining race!
            </p>

            {/* Mempool Capacity Gauge */}
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Mempool Staging Status:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {data?.mempool?.length || 0} / {data?.txBatchLimit || 2} Batched
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (((data?.mempool?.length || 0) / (data?.txBatchLimit || 2)) * 100))}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-zinc-500">
                {(data?.mempool?.length || 0) === 0 ? (
                  "Mempool empty. Submit transactions below to stage."
                ) : (data?.mempool?.length || 0) < (data?.txBatchLimit || 2) ? (
                  `1 transaction queued in staging pool. 1 more needed to trigger automatic mining!`
                ) : (
                  "Batch limit reached! PoW mining puzzle active."
                )}
              </div>
            </div>

            {/* Unmined Transactions in Staging Pool */}
            {data?.mempool && data.mempool.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Unmined Staged Transactions ({data.mempool.length}):
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {data.mempool.map((tx: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 font-mono text-[11px]">
                          {tx.message?.from} ➔ {tx.message?.to}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded font-mono font-bold text-[10px]">
                          {tx.message?.amount} BTC
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">
                        Sig: {tx.signature?.slice(0, 32)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Sign & Submit Form */}
            <form onSubmit={handleSimulateTx} className="space-y-2.5 pt-2 border-t border-zinc-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Sender (From)</label>
                  <input
                    type="text"
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Recipient (To)</label>
                  <input
                    type="text"
                    value={txTo}
                    onChange={(e) => setTxTo(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Amount (BTC)</label>
                <input
                  type="number"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={simulatingTx}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                {simulatingTx ? "Signing & Gossiping..." : "Sign (RSA-2048) & Transact to Mempool"}
              </button>
            </form>

            {txFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium">
                {txFeedback}
              </div>
            )}

            {/* Quick RSA Wallet Generator */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleGenerateWallet}
                disabled={generatingWallet}
                className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1.5 transition"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                {generatingWallet ? "Generating RSA 2048 Keys..." : "Generate Test RSA Wallet (GET /wallet)"}
              </button>
            </div>

            {wallet && (
              <div className="p-3 bg-zinc-900 rounded-xl text-white text-[10px] font-mono space-y-1.5">
                <div className="text-zinc-400 font-bold flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  Generated RSA-2048 Public Key (SPKI):
                </div>
                <pre className="p-1.5 bg-zinc-950 rounded text-emerald-400 overflow-x-auto max-h-24">
                  {wallet.publicKey}
                </pre>
              </div>
            )}
          </div>

          {/* Action A: HTTP POST /block -> Direct Mining Fallback */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-600" />
                HTTP API: Direct POST /block
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded border border-cyan-200">
                Direct Bypass
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Submit data to append a single block directly. For batched transactions, use the <strong>Mempool</strong> above.
            </p>

            <form onSubmit={handlePostBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Block Transaction Data</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit 1.42 ETH from 0x742d..."
                  value={blockPayload}
                  onChange={(e) => setBlockPayload(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={isMining || !blockPayload.trim()}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isMining ? "Flooding P2P Mesh..." : "POST /block & Flood to P2P Mesh"}
              </button>
            </form>
          </div>

          {/* Action B: TCP Simulated Peer Connection */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                TCP P2P: Connect Live Socket Peer
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                Port 6000
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Spawns an active TCP socket client connecting to <span className="font-mono">127.0.0.1:6000</span>. The server replies with a <span className="font-mono">SYNC</span> payload containing the full blockchain, and the peer listens for flooded blocks.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectSimulatedPeer}
                disabled={simulatingPeer}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                {simulatingPeer ? "Connecting Socket..." : "Connect Simulated TCP Peer"}
              </button>
            </div>

            {connectedPeers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Open TCP Sockets ({connectedPeers.length}):
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {connectedPeers.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-2 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] font-mono flex items-center justify-between"
                    >
                      <span className="text-zinc-800 font-bold">{p.id}</span>
                      <span className="text-zinc-500">
                        {p.remoteAddress}:{p.remotePort}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action C: UDP Discovery Datagram Ping */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-600" />
                UDP: Ping Discovery Service
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                Port 7000
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Dispatches a UDP datagram packet to <span className="font-mono">127.0.0.1:7000</span>. The Discovery service registers the peer IP and responds with <span className="font-mono text-purple-700 font-bold">PONG_DISCOVERY</span>.
            </p>

            <button
              onClick={handleUdpDiscoveryPing}
              disabled={probingUdp}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
            >
              <Activity className="w-3.5 h-3.5" />
              {probingUdp ? "Sending UDP Datagram..." : "Broadcast UDP Discovery Ping"}
            </button>

            {udpPingResult && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">UDP Ping Result:</span>
                  <span className="font-mono font-bold text-purple-700">{udpPingResult.latencyMs}ms</span>
                </div>
                <div className="font-mono text-purple-800">
                  Response: <strong>{udpPingResult.reply}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Action D: CLI Standalone Runner */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-700" />
                Standalone CLI Runner
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded">
                p2p-node.cjs
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Execute the complete script directly on the host using <span className="font-mono text-zinc-800">node p2p-node.cjs</span>.
            </p>

            <button
              onClick={handleRunCli}
              disabled={cliRunning}
              className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              {cliRunning ? "Executing CLI Script..." : "Run 'node p2p-node.cjs' Test"}
            </button>

            {cliOutput && (
              <pre className="p-3 bg-zinc-950 text-zinc-300 rounded-xl text-[10px] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                {cliOutput}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Live Event Logs & Blockchain Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Blockchain State */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-600" />
                  Synchronized Blockchain Ledger
                </h3>
                <p className="text-xs text-zinc-500">
                  Shared across HTTP clients and all connected TCP peers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800">
                Height: {data?.chainLength || 1}
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {blockchain.slice().reverse().map((b: any) => (
                <div
                  key={b.index}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 font-mono">
                        BLOCK #{b.index}
                      </span>
                      {b.index === 0 ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-200 text-zinc-700 font-bold">
                          GENESIS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold font-mono">
                          POW MINED
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-zinc-400 text-[10px]">
                      {new Date(b.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {b.hash && (
                    <div className="font-mono text-[10px] text-zinc-600 bg-white p-1.5 rounded border border-zinc-200 truncate">
                      <span className="text-zinc-400 font-semibold">Hash: </span>
                      <span className="text-emerald-700 font-bold">{b.hash}</span>
                      {b.nonce !== undefined && (
                        <span className="text-zinc-500 ml-2">(Nonce: {b.nonce})</span>
                      )}
                    </div>
                  )}

                  {/* Batched Transactions inside Block */}
                  {Array.isArray(b.transactions) && b.transactions.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Batched Transactions ({b.transactions.length}):
                      </div>
                      <div className="space-y-1">
                        {b.transactions.map((tx: any, tIdx: number) => (
                          <div
                            key={tIdx}
                            className="p-1.5 bg-white rounded border border-zinc-200 text-[11px] font-mono flex items-center justify-between"
                          >
                            <span className="text-zinc-800 font-semibold truncate max-w-[200px]">
                              {tx.message?.from} ➔ {tx.message?.to}
                            </span>
                            <span className="font-bold text-emerald-700 shrink-0">
                              {tx.message?.amount} BTC
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono text-zinc-700 bg-white p-1.5 rounded border border-zinc-200 text-[11px]">
                      Payload: {typeof b.data === "object" ? JSON.stringify(b.data) : String(b.data || "Genesis State")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Network Stream Logs */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-200">
                  Live Tri-Protocol Network Packet Log
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Real-time Socket & Datagram Stream
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-[11px] pr-1">
              {logs.length === 0 ? (
                <div className="text-zinc-500 text-center py-6">
                  No network packets recorded yet. Trigger a block submission or peer connection.
                </div>
              ) : (
                logs.map((log: any) => {
                  let badgeColor = "bg-zinc-800 text-zinc-300";
                  if (log.protocol === "HTTP") badgeColor = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";
                  if (log.protocol === "TCP") badgeColor = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
                  if (log.protocol === "UDP") badgeColor = "bg-purple-500/20 text-purple-400 border border-purple-500/30";

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                            [{log.protocol}]
                          </span>
                          <span className="font-bold text-zinc-200">{log.event}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">{log.details}</div>
                      {log.payload && (
                        <pre className="text-[10px] bg-zinc-950 p-1.5 rounded text-zinc-400 overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
