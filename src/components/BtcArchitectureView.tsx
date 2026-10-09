import React, { useState, useEffect } from "react";
import {
  Server,
  Network,
  Cpu,
  Terminal,
  Layers,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Code,
  Zap,
  Activity,
  Boxes,
  Database,
  Key,
  Coins,
  Send,
  Sliders,
  Radio,
  FileCode2,
  Scale,
  Flame,
  Globe,
} from "lucide-react";
import { NodesVsMinersCard } from "./btc/NodesVsMinersCard";
import { CustomBlockchainLab } from "./btc/CustomBlockchainLab";
import { MultiChainHubView } from "./btc/MultiChainHubView";
import { CustodialBankEngineView } from "./btc/CustodialBankEngineView";
import { MultiChainHdWalletView } from "./btc/MultiChainHdWalletView";
import { InfraPerformanceTuningView } from "./btc/InfraPerformanceTuningView";
import { PortMeshBlockchainView } from "./btc/PortMeshBlockchainView";
import { BtcMempoolMonitorView } from "./btc/BtcMempoolMonitorView";
import { SolanaPohEngineView } from "./btc/SolanaPohEngineView";
import { BtcHardwareBlueprintView } from "./btc/BtcHardwareBlueprintView";

interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: string;
  pruned: boolean;
  providerType: string;
  latencyMs: number;
}

interface FeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  minimumFee: number;
  economyFee: number;
  timestamp: string;
}

interface BlockSummary {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
}

export function BtcArchitectureView() {
  const [network, setNetwork] = useState<"mainnet" | "testnet" | "signet">("mainnet");
  const [activeTab, setActiveTab] = useState<
    | "hardware-blueprint"
    | "mempool-monitor"
    | "solana-poh"
    | "port-mesh"
    | "infra-tuning"
    | "overview"
    | "nodes-vs-miners"
    | "custom-chain"
    | "multichain-hub"
    | "hd-wallet"
    | "custodial-engine"
    | "rpc-playground"
    | "scripts"
    | "addresses"
    | "psbt-builder"
  >("hardware-blueprint");
  const [archMode, setArchMode] = useState<"fullnode" | "cloud" | "p2p">("fullnode");

  // Live data states
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const [fees, setFees] = useState<FeeRates | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);

  // RPC Playground states
  const [selectedRpcMethod, setSelectedRpcMethod] = useState<string>("getblockchaininfo");
  const [rpcParamsText, setRpcParamsText] = useState<string>("[]");
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [rpcLoading, setRpcLoading] = useState<boolean>(false);
  const [customHost, setCustomHost] = useState<string>("127.0.0.1");
  const [customPort, setCustomPort] = useState<number>(8332);
  const [customUser, setCustomUser] = useState<string>("bitcoinrpc");
  const [customPass, setCustomPass] = useState<string>("password123");
  const [useLocalRpc, setUseLocalRpc] = useState<boolean>(false);

  // Address Derivation
  const [derivedFormats, setDerivedFormats] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // PSBT Simulation
  const [psbtRecipient, setPsbtRecipient] = useState<string>("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
  const [psbtAmount, setPsbtAmount] = useState<number>(0.025);
  const [psbtFeeRate, setPsbtFeeRate] = useState<number>(12);
  const [psbtResult, setPsbtResult] = useState<any>(null);
  const [psbtLoading, setPsbtLoading] = useState<boolean>(false);

  // Script Runner
  const [scriptOutput, setScriptOutput] = useState<string>("");
  const [scriptRunning, setScriptRunning] = useState<boolean>(false);

  const fetchData = async () => {
    setStatusLoading(true);
    try {
      const [statusRes, feesRes, blocksRes] = await Promise.all([
        fetch(`/api/btc/status?network=${network}`),
        fetch(`/api/btc/fees?network=${network}`),
        fetch(`/api/btc/blocks?network=${network}`),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        if (sData.success) setBlockchainInfo(sData.info);
      }
      if (feesRes.ok) {
        const fData = await feesRes.json();
        if (fData.success) setFees(fData.fees);
      }
      if (blocksRes.ok) {
        const bData = await blocksRes.json();
        if (bData.success) setBlocks(bData.blocks);
      }
    } catch (_err) {
      // Handled
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAddresses();
  }, [network]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/btc/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) setDerivedFormats(data.derived);
    } catch (_err) {}
  };

  const handleExecuteRpc = async (overrideMethod?: string) => {
    const methodToRun = overrideMethod || selectedRpcMethod;
    setRpcLoading(true);
    try {
      let parsedParams = [];
      try {
        parsedParams = JSON.parse(rpcParamsText);
      } catch {
        parsedParams = [];
      }

      const config = useLocalRpc
        ? {
            rpcHost: customHost,
            rpcPort: customPort,
            rpcUser: customUser,
            rpcPassword: customPass,
            network,
            mode: "rpc",
          }
        : { network, mode: "esplora" };

      const res = await fetch("/api/btc/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: methodToRun,
          params: parsedParams,
          config,
        }),
      });
      const data = await res.json();
      setRpcResult(data);
    } catch (err: any) {
      setRpcResult({ success: false, error: err.message });
    } finally {
      setRpcLoading(false);
    }
  };

  const handleSimulatePsbt = async () => {
    setPsbtLoading(true);
    try {
      const res = await fetch("/api/btc/simulate-psbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: psbtRecipient,
          amountBtc: psbtAmount,
          feeRateSatVb: psbtFeeRate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPsbtResult(data.psbt);
      }
    } catch (_err) {}
    finally {
      setPsbtLoading(false);
    }
  };

  const handleRunLocalScript = async () => {
    setScriptRunning(true);
    setScriptOutput("Executing `node btc-node-client.js` in background runtime...\n");
    try {
      const res = await fetch("/api/btc/run-script", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScriptOutput(data.output);
      } else {
        setScriptOutput(`[Execution Error Exit Code ${data.exitCode}]:\n${data.output}`);
      }
    } catch (err: any) {
      setScriptOutput(`Failed to launch script: ${err.message}`);
    } finally {
      setScriptRunning(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-zinc-50 border border-amber-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0 font-bold text-2xl">
              ₿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                  Bitcoin (BTC) Node.js Architecture Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  JSON-RPC & Esplora
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-1 max-w-3xl">
                Comprehensive guide and interactive workspace for interfacing Node.js applications with the Bitcoin network. Run JSON-RPC queries, inspect live blocks and mempool fees, derive SegWit/Taproot addresses, and construct PSBTs.
              </p>
            </div>
          </div>

          {/* Network Selector & Refresh */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="bg-white border border-zinc-200 rounded-lg p-1 flex items-center shadow-2xs">
              {(["mainnet", "testnet", "signet"] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setNetwork(net)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                    network === net
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              disabled={statusLoading}
              className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh Blockchain Data"
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-amber-200/60">
          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-100 shadow-2xs">
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-amber-600" />
              Tip Block Height
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
              {blockchainInfo ? `#${blockchainInfo.blocks.toLocaleString()}` : "Loading..."}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {blockchainInfo?.providerType === "live-mempool-esplora" ? "Live Mempool Gateway" : "Node RPC"}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-100 shadow-2xs">
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Next Block Fee
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
              {fees ? `${fees.fastestFee} sat/vB` : "..."}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              30m: {fees?.halfHourFee || "--"} | 1h: {fees?.hourFee || "--"}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-100 shadow-2xs">
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              Ledger Size
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
              {blockchainInfo?.size_on_disk || "614.2 GB"}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Verification: 100%
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-100 shadow-2xs">
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              RPC Latency
            </div>
            <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
              {blockchainInfo?.latencyMs ? `${blockchainInfo.latencyMs} ms` : "< 80 ms"}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Sub-second response
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: "hardware-blueprint", label: "Hardware Link & Blueprint", icon: Cpu, isHardware: true },
          { id: "solana-poh", label: "Solana Proof of History (PoH)", icon: Zap, isNew: true },
          { id: "mempool-monitor", label: "Automated Mempool & Block Monitor", icon: Radio, isLive: true },
          { id: "port-mesh", label: "Port-as-Client BTC Mesh", icon: Network },
          { id: "infra-tuning", label: "Node Tuning & Sockets", icon: Zap },
          { id: "overview", label: "Topologies & Architecture", icon: Layers },
          { id: "nodes-vs-miners", label: "Nodes vs. Miners", icon: Scale },
          { id: "custom-chain", label: "Custom Blockchain & PoW", icon: Boxes },
          { id: "multichain-hub", label: "Multi-Chain (BTC & ETH)", icon: Globe },
          { id: "hd-wallet", label: "HD Wallets (BIP-84/44)", icon: Key },
          { id: "custodial-engine", label: "Custodial Vault & Engine", icon: Flame },
          { id: "rpc-playground", label: "JSON-RPC Playground", icon: Terminal },
          { id: "addresses", label: "Address Types", icon: ShieldCheck },
          { id: "psbt-builder", label: "PSBT Simulator", icon: Coins },
          { id: "scripts", label: "Node.js Code & CLI", icon: FileCode2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-amber-500 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.isHardware && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  HARDWARE
                </span>
              )}
              {tab.isLive && (
                <span className="flex items-center space-x-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE</span>
                </span>
              )}
              {tab.isNew && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  PoH VDF
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: BITCOIN HARDWARE LINK & ARCHITECTURE BLUEPRINT */}
      {activeTab === "hardware-blueprint" && <BtcHardwareBlueprintView />}

      {/* TAB: SOLANA PROOF OF HISTORY (PoH) & VDF ENGINE */}
      {activeTab === "solana-poh" && <SolanaPohEngineView />}

      {/* TAB 0: AUTOMATED MEMPOOL & BLOCK BROADCAST MONITOR */}
      {activeTab === "mempool-monitor" && (
        <BtcMempoolMonitorView network={network} onNetworkChange={setNetwork} />
      )}

      {/* TAB 1: ARCHITECTURE OVERVIEW & DIAGRAM */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Architecture Modes Switcher */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Select Architectural Topology
              </h3>
              <div className="flex gap-2">
                {[
                  { id: "fullnode", label: "1. Self-Hosted Full Node (bitcoind)" },
                  { id: "cloud", label: "2. Cloud RPC / Esplora REST" },
                  { id: "p2p", label: "3. Direct P2P / SPV (Neutrino)" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setArchMode(mode.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      archMode === mode.id
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Interactive Diagram */}
            <div className="bg-zinc-950 text-zinc-100 rounded-xl p-6 font-mono text-xs overflow-x-auto border border-zinc-800">
              {archMode === "fullnode" && (
                <div>
                  <div className="text-amber-400 font-bold text-sm mb-3">
                    [TOPOLOGY 1: Self-Hosted Sovereign Node Architecture]
                  </div>
                  <pre className="text-zinc-300 leading-relaxed">
{`┌────────────────────────────────┐
│   Your Node.js Application     │
│   (server.ts / Express / Nest) │
└──────────────┬─────────────────┘
               │  JSON-RPC (Port 8332 or 18332)
               │  Auth: Basic base64(rpcuser:rpcpassword)
               │  Format: { jsonrpc: "1.0", id, method, params }
               ▼
┌────────────────────────────────┐        ZeroMQ (ZMQ) Pub/Sub
│   Bitcoin Core (bitcoind)      ├──────────────────────────────► [Real-time Block/Tx
│   - Full Validation Engine     │   tcp://127.0.0.1:28332         Event Subscriber]
│   - Mempool & UTXO Set (LevelDB)
│   - Wallet Signer / PSBT       │
└──────────────┬─────────────────┘
               │  P2P Gossip Wire Protocol
               │  Port 8333 (Mainnet)
               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Global Bitcoin P2P Network                  │
│       (~18,000+ consensus nodes, miners, mempool relays)     │
└──────────────────────────────────────────────────────────────┘`}
                  </pre>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-emerald-400 font-semibold">Pros:</span> 100% trustless, full sovereign validation, no third-party rate limits or data leaks.
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-amber-400 font-semibold">Requirements:</span> ~650 GB fast NVMe SSD, 8GB+ RAM, 24-48h Initial Block Download (IBD).
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-cyan-400 font-semibold">Node.js Stack:</span> <code className="text-amber-300">bitcoin-core</code>, <code className="text-amber-300">zeromq</code>, <code className="text-amber-300">bitcoinjs-lib</code>.
                    </div>
                  </div>
                </div>
              )}

              {archMode === "cloud" && (
                <div>
                  <div className="text-cyan-400 font-bold text-sm mb-3">
                    [TOPOLOGY 2: Cloud Gateway & Esplora REST Architecture (Lightweight)]
                  </div>
                  <pre className="text-zinc-300 leading-relaxed">
{`┌────────────────────────────────┐
│   Your Node.js Application     │
│   (Local Keys & Signer)        │  ◄── Private keys NEVER leave your Node server!
└──────────────┬─────────────────┘      You sign PSBTs locally with 'bitcoinjs-lib'
               │  HTTPS REST / JSON-RPC
               │  Endpoints: /blocks, /fees, /tx, /broadcast
               ▼
┌──────────────────────────────────────────────────────────────┐
│   Managed Cloud Gateway / Node Providers                     │
│   - Mempool.space / Blockstream Esplora (Zero Auth REST)     │
│   - Alchemy / QuickNode / Infura (Dedicated RPC Endpoints)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Global Bitcoin P2P Network                  │
└──────────────────────────────────────────────────────────────┘`}
                  </pre>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-emerald-400 font-semibold">Pros:</span> Instant deployment, 0 GB disk requirement, zero sync lag, high-availability SLAs.
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-amber-400 font-semibold">Security Rule:</span> Keep private keys strictly local! Only use cloud nodes to fetch UTXOs and broadcast signed raw hex.
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-cyan-400 font-semibold">Best For:</span> Microservices, serverless Lambdas, mobile backends, arbitrage bots.
                    </div>
                  </div>
                </div>
              )}

              {archMode === "p2p" && (
                <div>
                  <div className="text-purple-400 font-bold text-sm mb-3">
                    [TOPOLOGY 3: Direct SPV / Neutrino Wire Client (BIP 157/158)]
                  </div>
                  <pre className="text-zinc-300 leading-relaxed">
{`┌────────────────────────────────┐
│   Your Node.js Application     │
│   (bcoin / bcoin-spv / btc-p2p)│
└──────────────┬─────────────────┘
               │  Direct TCP Socket (Port 8333)
               │  BIP 157 / BIP 158 Compact Block Filters (Golomb-Coded Sets)
               ▼
┌──────────────────────────────────────────────────────────────┐
│              Global Bitcoin P2P Full Nodes (Peers)           │
│   - Sends peer discovery 'version' & 'verack'                │
│   - Downloads filter headers only (~100 MB total)            │
│   - Requests only relevant full blocks matching your wallet  │
└──────────────────────────────────────────────────────────────┘`}
                  </pre>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-emerald-400 font-semibold">Pros:</span> Direct decentralized P2P wire communication with no centralized API dependency.
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-amber-400 font-semibold">Storage:</span> Only requires ~100MB filter cache instead of 650GB full block archive.
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <span className="text-cyan-400 font-semibold">Libraries:</span> <code className="text-amber-300">bcoin</code>, <code className="text-amber-300">neutrino</code>, <code className="text-amber-300">bitcoin-net</code>.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Blocks Live Feed */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-zinc-900 text-sm">
                  Latest Mined Blocks (Live Network Stream)
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                Auto-updated via tip indexer
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 bg-zinc-50/50">
                    <th className="py-2.5 px-3 font-semibold">Height</th>
                    <th className="py-2.5 px-3 font-semibold">Block Hash</th>
                    <th className="py-2.5 px-3 font-semibold">Transactions</th>
                    <th className="py-2.5 px-3 font-semibold">Size (MB)</th>
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {blocks.length > 0 ? (
                    blocks.map((b) => (
                      <tr key={b.id} className="hover:bg-zinc-50/80 font-mono">
                        <td className="py-2.5 px-3 font-bold text-amber-600">
                          #{b.height.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 truncate max-w-xs" title={b.id}>
                          {b.id.slice(0, 16)}...{b.id.slice(-8)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-900">
                          {b.tx_count.toLocaleString()} txs
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {(b.size / 1_000_000).toFixed(2)} MB
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500">
                          {new Date(b.timestamp * 1000).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400">
                        Querying Bitcoin block stream...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NODES VS MINERS (THE CONSENSUS ARCHITECTURE) */}
      {activeTab === "nodes-vs-miners" && <NodesVsMinersCard />}

      {/* TAB: CUSTOM BLOCKCHAIN ENGINE & P2P LAB */}
      {activeTab === "custom-chain" && <CustomBlockchainLab />}

      {/* TAB: MULTI-CHAIN HUB (BITCOIN & ETHEREUM) */}
      {activeTab === "multichain-hub" && <MultiChainHubView />}

      {/* TAB: MULTI-CHAIN HD WALLET DERIVATION */}
      {activeTab === "hd-wallet" && <MultiChainHdWalletView />}

      {/* TAB: INSTITUTIONAL CUSTODIAL ENGINE & VAULT */}
      {activeTab === "custodial-engine" && <CustodialBankEngineView />}

      {/* TAB 2: JSON-RPC PLAYGROUND */}
      {activeTab === "rpc-playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                RPC Endpoint Target
              </h3>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div>
                  <div className="text-xs font-semibold text-zinc-900">Connect to Custom Local Node</div>
                  <div className="text-[11px] text-zinc-500">Target bitcoind on localhost:8332</div>
                </div>
                <input
                  type="checkbox"
                  checked={useLocalRpc}
                  onChange={(e) => setUseLocalRpc(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
              </div>

              {useLocalRpc && (
                <div className="space-y-3 p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs">
                  <div>
                    <label className="block text-zinc-600 font-medium mb-1">Host & Port</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customHost}
                        onChange={(e) => setCustomHost(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-300 rounded font-mono text-xs"
                        placeholder="127.0.0.1"
                      />
                      <input
                        type="number"
                        value={customPort}
                        onChange={(e) => setCustomPort(parseInt(e.target.value, 10))}
                        className="w-24 px-2.5 py-1.5 bg-white border border-zinc-300 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-600 font-medium mb-1">RPC User</label>
                      <input
                        type="text"
                        value={customUser}
                        onChange={(e) => setCustomUser(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-600 font-medium mb-1">RPC Password</label>
                      <input
                        type="password"
                        value={customPass}
                        onChange={(e) => setCustomPass(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preset RPC methods */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Standard Bitcoin Core Methods
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { method: "getblockchaininfo", params: "[]" },
                    { method: "getnetworkinfo", params: "[]" },
                    { method: "getmempoolinfo", params: "[]" },
                    { method: "estimatesmartfee", params: "[6, \"CONSERVATIVE\"]" },
                  ].map((preset) => (
                    <button
                      key={preset.method}
                      onClick={() => {
                        setSelectedRpcMethod(preset.method);
                        setRpcParamsText(preset.params);
                        handleExecuteRpc(preset.method);
                      }}
                      className={`px-2.5 py-1.5 text-xs text-left rounded-md font-mono transition-colors truncate border ${
                        selectedRpcMethod === preset.method
                          ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                          : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {preset.method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Method Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Method Name
                </label>
                <input
                  type="text"
                  value={selectedRpcMethod}
                  onChange={(e) => setSelectedRpcMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. getblockcount"
                />
              </div>

              {/* Params JSON */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Parameters (JSON Array)
                </label>
                <input
                  type="text"
                  value={rpcParamsText}
                  onChange={(e) => setRpcParamsText(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="[]"
                />
              </div>

              <button
                onClick={() => handleExecuteRpc()}
                disabled={rpcLoading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {rpcLoading ? "Querying RPC..." : "Dispatch RPC Call"}
              </button>
            </div>
          </div>

          {/* Response Inspector Column */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xs h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs">
                <span className="text-zinc-400 font-mono">
                  RPC Response: <span className="text-amber-400 font-bold">{selectedRpcMethod}</span>
                </span>
                {rpcResult && (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(rpcResult, null, 2), "rpc-out")}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                  >
                    {copiedIndex === "rpc-out" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy JSON
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[480px]">
                {rpcLoading ? (
                  <div className="flex items-center justify-center h-48 text-zinc-500 text-xs font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Executing remote procedure call over JSON-RPC 2.0...
                  </div>
                ) : rpcResult ? (
                  <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                    {JSON.stringify(rpcResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-zinc-600 text-xs font-mono p-4 text-center">
                    Select an RPC method or press "Dispatch RPC Call" to view the response payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NODE.JS CODE EXAMPLES & STANDALONE SCRIPT RUNNER */}
      {activeTab === "scripts" && (
        <div className="space-y-6">
          {/* Live Script Runner Panel */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-600" />
                  Live Local Script Execution: <code className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">btc-node-client.js</code>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Run the dedicated Node.js Bitcoin client directly in the sandbox container to test local RPC and live Esplora queries.
                </p>
              </div>

              <button
                onClick={handleRunLocalScript}
                disabled={scriptRunning}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs shrink-0 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {scriptRunning ? "Running..." : "Run Script (node btc-node-client.js)"}
              </button>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs text-zinc-200 border border-zinc-800 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {scriptOutput || "Click 'Run Script' above to execute the background Bitcoin Node client script."}
              </pre>
            </div>
          </div>

          {/* Node.js Implementation Snippets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Snippet 1: Bitcoin Core Setup */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-amber-600" />
                  1. Connecting with `bitcoin-core`
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import BitcoinCore from 'bitcoin-core';\n\nconst client = new BitcoinCore({\n  network: 'mainnet',\n  host: '127.0.0.1',\n  port: 8332,\n  username: process.env.BTC_RPC_USER,\n  password: process.env.BTC_RPC_PASSWORD,\n});\n\nconst info = await client.getBlockchainInfo();\nconsole.log('Block height:', info.blocks);`,
                      "code1"
                    )
                  }
                  className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                >
                  {copiedIndex === "code1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
                <pre>{`import BitcoinCore from 'bitcoin-core';

// Initialize RPC client
const client = new BitcoinCore({
  network: 'mainnet', // 'testnet' or 'regtest'
  host: '127.0.0.1',
  port: 8332,
  username: process.env.BTC_RPC_USER,
  password: process.env.BTC_RPC_PASSWORD,
});

// Query node
const info = await client.getBlockchainInfo();
console.log('Current Block Height:', info.blocks);`}</pre>
              </div>
            </div>

            {/* Snippet 2: bitcoinjs-lib Signing */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  2. Signing PSBT with `bitcoinjs-lib`
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import * as bitcoin from 'bitcoinjs-lib';\n\nconst psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });\npsbt.addInput({\n  hash: 'utxo_txid',\n  index: 0,\n  witnessUtxo: { script: Buffer.from('...'), value: 50000 },\n});\npsbt.addOutput({\n  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',\n  value: 40000,\n});\npsbt.signInput(0, keyPair);\npsbt.finalizeAllInputs();\nconst rawHex = psbt.extractTransaction().toHex();`,
                      "code2"
                    )
                  }
                  className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                >
                  {copiedIndex === "code2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
                <pre>{`import * as bitcoin from 'bitcoinjs-lib';

// Create PSBT (Partially Signed Bitcoin Tx)
const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

psbt.addInput({
  hash: utxoTxId,
  index: 0,
  witnessUtxo: { script: scriptPubKey, value: 50000 },
});

psbt.addOutput({
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  value: 45000, // Remaining 5000 sats goes to miner fee
});

psbt.signInput(0, keyPair);
psbt.finalizeAllInputs();
const rawHex = psbt.extractTransaction().toHex();`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADDRESS FORMATS & DERIVATION */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Bitcoin Script & Address Evolution
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Modern Bitcoin applications prioritize Native SegWit (Bech32) and Taproot (Bech32m) to reduce byte sizes and save up to 40% in miner fees compared to legacy P2PKH.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {derivedFormats?.formats?.map((fmt: any, idx: number) => (
                <div
                  key={fmt.type}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-amber-300 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900">{fmt.type}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {fmt.bip}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-zinc-500">
                    Derivation Path: <span className="text-zinc-900 font-semibold">{fmt.derivationPath}</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-zinc-200 font-mono text-xs flex items-center justify-between">
                    <span className="text-zinc-800 truncate" title={fmt.sampleAddress}>
                      {fmt.sampleAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(fmt.sampleAddress, `addr-${idx}`)}
                      className="text-zinc-400 hover:text-zinc-900 ml-2"
                    >
                      {copiedIndex === `addr-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-600 bg-amber-50/60 p-2 rounded border border-amber-100/60">
                    <span className="font-semibold text-amber-900">Fee Efficiency:</span> {fmt.vByteEfficiency}
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 truncate" title={fmt.scriptPubKey}>
                    scriptPubKey: {fmt.scriptPubKey}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PSBT BUILDER & SIMULATOR */}
      {activeTab === "psbt-builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                PSBT Transaction Constructor
              </h3>
              <p className="text-xs text-zinc-500">
                Unlike Ethereum's account balance model, Bitcoin uses UTXOs (Unspent Transaction Outputs). Every transaction consumes previous outputs and creates new ones with precise sat/vB fees.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={psbtRecipient}
                  onChange={(e) => setPsbtRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Amount (BTC)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={psbtAmount}
                    onChange={(e) => setPsbtAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Fee Rate (sat/vB)
                  </label>
                  <input
                    type="number"
                    value={psbtFeeRate}
                    onChange={(e) => setPsbtFeeRate(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulatePsbt}
                disabled={psbtLoading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5" />
                {psbtLoading ? "Constructing PSBT..." : "Build & Calculate PSBT"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xs h-full flex flex-col">
              <div className="text-xs font-mono text-zinc-400 pb-3 border-b border-zinc-800 mb-3 flex items-center justify-between">
                <span>PSBT Structure & Fee Breakdown</span>
                {psbtResult && (
                  <span className="text-emerald-400 font-bold">
                    Virtual Size: {psbtResult.fee?.virtualSizeVb} vB
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[480px]">
                {psbtResult ? (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <div className="text-amber-400 font-bold mb-2">Execution Steps:</div>
                      {psbtResult.steps?.map((s: string, idx: number) => (
                        <div key={idx} className="text-zinc-300 leading-relaxed">
                          {s}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                        <span className="text-zinc-500 block">Total Mining Fee:</span>
                        <span className="text-emerald-400 font-bold">
                          {psbtResult.fee?.totalSat} sats ({psbtResult.fee?.totalBtc} BTC)
                        </span>
                      </div>
                      <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                        <span className="text-zinc-500 block">Signing Status:</span>
                        <span className="text-cyan-400 font-bold">{psbtResult.signingStatus}</span>
                      </div>
                    </div>

                    <pre className="text-zinc-400 leading-relaxed text-[11px] bg-zinc-900/60 p-3 rounded border border-zinc-800/80 overflow-x-auto">
                      {JSON.stringify(psbtResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-zinc-600 text-xs font-mono p-6 text-center">
                    Enter transaction values and press "Build & Calculate PSBT" to visualize the UTXO input/output resolution and vByte fee calculation.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PORT-AS-CLIENT BTC MESH */}
      {activeTab === "port-mesh" && <PortMeshBlockchainView />}

      {/* TAB: NODE TUNING & SOCKETS */}
      {activeTab === "infra-tuning" && <InfraPerformanceTuningView />}
    </div>
  );
}
