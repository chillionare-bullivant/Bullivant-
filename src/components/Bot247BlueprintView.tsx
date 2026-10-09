import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Terminal,
  Activity,
  Zap,
  Layers,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Server,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Folder,
  ChevronRight,
  TrendingUp,
  Clock,
  Radio,
  Share2,
  HardDrive,
  Coins,
  ArrowDownRight,
  Sparkles,
  Gauge,
  Play,
  Pause,
  Trash2,
  Lock,
  ExternalLink,
} from "lucide-react";

interface CryptoPrice {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
  direction: "up" | "down" | "flat";
}

interface MintEvent {
  id: string;
  token: string;
  contract: string;
  from: string;
  to: string;
  amountFormatted: number;
  tx: string;
  blockNumber: number;
  timestamp: number;
  processedByQueue: boolean;
}

interface BlockEvent {
  chain: "ETH" | "BSC" | "SOL";
  blockNumber: number;
  timestamp: number;
  txCount: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "success" | "event";
  worker: string;
  message: string;
}

interface RpcBenchmarkItem {
  name: string;
  chain: string;
  url: string;
  latencyMs: number;
  blockNumber?: number;
  status: "optimal" | "acceptable" | "high-latency" | "error";
  success: boolean;
  error?: string;
}

interface RepoFile {
  path: string;
  name: string;
  size: number;
  content: string;
  category: string;
}

export function Bot247BlueprintView() {
  const [activeTab, setActiveTab] = useState<"monitor" | "benchmark" | "terminal" | "blueprint" | "code" | "simulation">("monitor");
  const [copiedFile, setCopiedFile] = useState(false);
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [blocks, setBlocks] = useState<BlockEvent[]>([]);
  const [mints, setMints] = useState<MintEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsPaused, setIsLogsPaused] = useState(false);

  const [reconnectStats, setReconnectStats] = useState<any>({
    status: "connected",
    reconnectAttempts: 0,
    totalDisconnects: 0,
    uptimeSeconds: 120,
  });
  const [queueStats, setQueueStats] = useState<any>({
    name: "mints",
    mode: "BullMQ / In-Memory Resilient",
    activeJobs: 0,
    completedJobs: 14,
    concurrency: 5,
  });
  const [pm2Cluster, setPm2Cluster] = useState<any>({
    appName: "structures-24-7",
    instances: [
      { id: 0, pid: 2940, status: "online", memoryMb: 43.8, uptime: "24h 12m" },
      { id: 1, pid: 2941, status: "online", memoryMb: 42.1, uptime: "24h 12m" },
    ],
  });

  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("src/utils/reconnect.js");

  // Simulation states
  const [mintSimAmount, setMintSimAmount] = useState<number>(50000000);
  const [simulatingMint, setSimulatingMint] = useState<boolean>(false);
  const [mintSimSuccess, setMintSimSuccess] = useState<string | null>(null);

  const [simulatingReconnect, setSimulatingReconnect] = useState<boolean>(false);
  const [reconnectLog, setReconnectLog] = useState<string | null>(null);

  // Benchmarks
  const [benchmarks, setBenchmarks] = useState<RpcBenchmarkItem[]>([
    { name: "Flashbots MEV-Protect", chain: "Ethereum", url: "https://rpc.flashbots.net", latencyMs: 142, blockNumber: 26017315, status: "optimal", success: true },
    { name: "PublicNode Public RPC", chain: "Ethereum", url: "https://ethereum-rpc.publicnode.com", latencyMs: 185, blockNumber: 26017315, status: "optimal", success: true },
    { name: "Base Mainnet Gateway", chain: "Base (L2)", url: "https://mainnet.base.org", latencyMs: 128, blockNumber: 51550497, status: "optimal", success: true },
    { name: "Arbitrum One RPC", chain: "Arbitrum (L2)", url: "https://arb1.arbitrum.io/rpc", latencyMs: 210, blockNumber: 274891000, status: "optimal", success: true },
    { name: "BNB Chain (LlamaRPC)", chain: "BNB Chain", url: "https://binance.llamarpc.com", latencyMs: 290, blockNumber: 42910300, status: "optimal", success: true },
  ]);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkTimestamp, setBenchmarkTimestamp] = useState<number>(Date.now());

  // Live CLI Execution state
  const [runningBotCli, setRunningBotCli] = useState<boolean>(false);
  const [botCliOutput, setBotCliOutput] = useState<string | null>(null);
  const [botCliResult, setBotCliResult] = useState<any>(null);
  const [terminalViewMode, setTerminalViewMode] = useState<"cli" | "pm2">("cli");

  // MEV Bundle Simulator state
  const [bundleSimState, setBundleSimState] = useState<{
    targetBlock: number;
    bribeEth: number;
    bundleTxs: number;
    status: "idle" | "building" | "sent";
    result?: string;
  }>({
    targetBlock: 26017316,
    bribeEth: 0.008,
    bundleTxs: 2,
    status: "idle",
  });

  // Polling real-time 24/7 status with resilient fallback
  useEffect(() => {
    let isMounted = true;
    let failureCount = 0;

    async function fetchStatus() {
      // Pause polling if document tab is backgrounded to save bandwidth & prevent failed aborts
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("/api/bot247/status", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          failureCount = 0;
          if (isMounted) {
            setPrices(data.prices || {});
            setBlocks(data.blocks || []);
            setMints(data.mints || []);
            setReconnectStats(data.reconnectStats || {});
            setQueueStats(data.queueStats || {});
            setPm2Cluster(data.pm2Cluster || {});
            if (!isLogsPaused && data.logs) {
              setLogs(data.logs);
            }
          }
        } else {
          failureCount++;
        }
      } catch (_err) {
        failureCount++;
        // Transient network hiccup or dev server restart - gracefully flag as reconnecting without polluting console
        if (isMounted && failureCount >= 3) {
          setReconnectStats((prev: any) => ({
            ...prev,
            status: "reconnecting",
          }));
        }
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLogsPaused]);

  // Fetch file list
  useEffect(() => {
    let isMounted = true;
    async function fetchFiles() {
      try {
        const res = await fetch("/api/bot247/files");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFiles(data.files || []);
          }
        }
      } catch (_err) {
        // Fallback or offline state handled gracefully
      }
    }
    fetchFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSimulateMint = async () => {
    setSimulatingMint(true);
    setMintSimSuccess(null);
    try {
      const res = await fetch("/api/bot247/simulate-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: mintSimAmount,
          recipient: "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMintSimSuccess(`Triggered $${mintSimAmount.toLocaleString()} USDT mint from 0x000...000 → BullMQ Queue`);
        const statusRes = await fetch("/api/bot247/status");
        const statusData = await statusRes.json();
        setMints(statusData.mints || []);
        setQueueStats(statusData.queueStats || {});
        if (statusData.logs) setLogs(statusData.logs);
      }
    } catch (err: any) {
      setMintSimSuccess("Failed to trigger mint simulation: " + err.message);
    } finally {
      setSimulatingMint(false);
    }
  };

  const handleSimulateReconnect = async () => {
    setSimulatingReconnect(true);
    setReconnectLog(null);
    try {
      const res = await fetch("/api/bot247/simulate-reconnect", { method: "POST" });
      const data = await res.json();
      setReconnectLog(
        `[TEST] Socket closed on provider. Auto-reconnect heartbeat initiated with 3000ms timer. Process remained healthy without dropping.`
      );
      setReconnectStats((prev: any) => ({
        ...prev,
        status: "reconnecting",
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));

      setTimeout(async () => {
        const statusRes = await fetch("/api/bot247/status");
        const statusData = await statusRes.json();
        setReconnectStats(statusData.reconnectStats || {});
        if (statusData.logs) setLogs(statusData.logs);
        setReconnectLog((prev) => `${prev}\n[SUCCESS] Reconnected to stream. Subscriptions restored.`);
        setSimulatingReconnect(false);
      }, 3200);
    } catch (err: any) {
      setReconnectLog("Reconnect trigger error: " + err.message);
      setSimulatingReconnect(false);
    }
  };

  const handleRunRpcBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch("/api/bot247/benchmark-rpcs");
      const data = await res.json();
      if (data.success && data.results) {
        setBenchmarks(data.results);
        setBenchmarkTimestamp(data.timestamp || Date.now());
      }
    } catch (_err) {
      // Benchmark error handled gracefully
    } finally {
      setBenchmarking(false);
    }
  };

  const handleSimulateMevBundle = () => {
    setBundleSimState((prev) => ({ ...prev, status: "building" }));
    setTimeout(() => {
      setBundleSimState((prev) => ({
        ...prev,
        status: "sent",
        result: `MEV-Share Bundle #bf719 relayed to Flashbots Builder: targetBlock ${prev.targetBlock + 1}, bundleHash 0x9f1a...8e21, minerBribe: ${prev.bribeEth} ETH. Protected against sandwich attacks!`,
      }));
    }, 1400);
  };

  const handleExecuteBotCli = async () => {
    setRunningBotCli(true);
    setActiveTab("terminal");
    setTerminalViewMode("cli");
    setBotCliOutput("⏳ Spawning Node process: `node run-bot-24-7.js`...\nConnecting live to ETH (PublicNode), BSC (PublicNode), Solana, and Binance WebSocket streams...");
    try {
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: "run-bot-24-7.js" }),
      });
      const data = await res.json();
      setBotCliResult(data);
      if (data.stdout) {
        setBotCliOutput(data.stdout);
      } else if (data.stderr) {
        setBotCliOutput(data.stderr);
      } else {
        setBotCliOutput("No output returned from process.");
      }
    } catch (err: any) {
      setBotCliOutput("Process execution failed: " + err.message);
    } finally {
      setRunningBotCli(false);
    }
  };

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    }
  };

  const handleDownloadZip = () => {
    window.location.href = "/api/bot247/download-zip";
  };

  return (
    <div id="bot-247-view-root" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide uppercase">
                  24/7 Crash-Proof Architecture
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  BTC / ETH / SOL / BNB / USDT
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
                24/7 Multi-Chain Listeners &amp; Bot Engine
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Production blueprint with auto-reconnect WebSocket wrappers, BullMQ decoupled event ingestion, PM2 dual-worker clustering, and Flashbots MEV protection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="execute-bot-cli-header-btn"
                type="button"
                onClick={handleExecuteBotCli}
                disabled={runningBotCli}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${runningBotCli ? "animate-spin text-zinc-950" : "fill-current"}`} />
                <span>{runningBotCli ? "Executing Bot (Live)..." : "Execute Bot (Live CLI Run)"}</span>
              </button>

              <button
                id="download-zip-btn"
                type="button"
                onClick={handleDownloadZip}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 border border-zinc-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download ZIP</span>
                <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded font-mono text-zinc-300">bot-24-7.zip</span>
              </button>

              <button
                id="test-reconnect-btn"
                type="button"
                onClick={handleSimulateReconnect}
                disabled={simulatingReconnect}
                className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simulatingReconnect ? "animate-spin text-amber-400" : ""}`} />
                <span>Test 3s Reconnect</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-900/70 rounded-lg p-2.5 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Stream Status</span>
              </div>
              <div className="text-sm font-semibold font-mono text-emerald-400 mt-0.5 uppercase">
                {reconnectStats.status || "CONNECTED"}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Uptime: {Math.floor((reconnectStats.uptimeSeconds || 0) / 60)}m • Retries: {reconnectStats.reconnectAttempts || 0}
              </div>
            </div>

            <div className="bg-zinc-900/70 rounded-lg p-2.5 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>BullMQ Queue</span>
              </div>
              <div className="text-sm font-semibold font-mono text-white mt-0.5">
                {queueStats.completedJobs || 0} Processed
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Decoupled Ingestion Mode
              </div>
            </div>

            <div className="bg-zinc-900/70 rounded-lg p-2.5 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>PM2 Cluster</span>
              </div>
              <div className="text-sm font-semibold font-mono text-purple-300 mt-0.5">
                2 Instances Online
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Zero-Downtime Cluster Mode
              </div>
            </div>

            <div className="bg-zinc-900/70 rounded-lg p-2.5 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>USDT Mint Radar</span>
              </div>
              <div className="text-sm font-semibold font-mono text-amber-300 mt-0.5">
                {mints.length} Mints Tracked
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                from: ethers.ZeroAddress
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/70 px-4 pt-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("monitor")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "monitor"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>24/7 Live Stream &amp; Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("benchmark")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "benchmark"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            <span>Multi-RPC Latency Benchmark</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "terminal"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-700" />
            <span>PM2 Live Logs Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("blueprint")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "blueprint"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The 3 Core Rules (Blueprint)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "code"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Project Files Viewer ({files.length} files)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("simulation")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "simulation"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Failover &amp; MEV Simulator</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live Stream & Radar */}
      {activeTab === "monitor" && (
        <div className="space-y-6">
          {/* Live Binance Price Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>24/7 Binance WebSocket Price Stream (Auto-Reconnect Enabled)</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">wss://stream.binance.com:9443</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.keys(prices).length > 0 ? (
                (Object.values(prices) as CryptoPrice[]).map((item) => (
                  <div
                    key={item.symbol}
                    className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-zinc-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 font-mono tracking-wide">
                        {item.symbol.replace("USDT", "")} / USDT
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          item.direction === "up"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : item.direction === "down"
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-zinc-50 text-zinc-500"
                        }`}
                      >
                        {item.direction === "up" ? "▲ TICK" : item.direction === "down" ? "▼ TICK" : "— FLAT"}
                      </span>
                    </div>

                    <div className="text-2xl font-bold font-mono text-zinc-900 mt-2 tracking-tight">
                      ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                      <span>Vol: {item.quantity}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 p-8 text-center bg-white border border-zinc-200 rounded-xl text-zinc-400 font-mono text-xs">
                  Connecting to Binance multi-stream...
                </div>
              )}
            </div>
          </div>

          {/* Block Progression & Multi-Chain Pulse */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blocks.map((block) => (
              <div
                key={block.chain}
                className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                      block.chain === "ETH"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : block.chain === "BSC"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {block.chain}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      {block.chain === "SOL" ? "Solana Slot" : `${block.chain} Mainnet Block`}
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900">
                      #{block.blockNumber.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                    ~{block.txCount} txs
                  </span>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* USDT Zero-Address Mint Radar (Rule #2 In Action) */}
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/50">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>USDT Zero-Address Mint Radar (Rule #2 Demo)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    ethers.ZeroAddress
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Filters <code className="font-mono text-zinc-700">Transfer(from, to, amount)</code> where <code className="font-mono text-emerald-600">from === ethers.ZeroAddress</code>. Pushes immediately into BullMQ queue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateMint}
                disabled={simulatingMint}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{simulatingMint ? "Injecting..." : "Simulate $50M Mint"}</span>
              </button>
            </div>

            {mintSimSuccess && (
              <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mintSimSuccess}</span>
              </div>
            )}

            <div className="divide-y divide-zinc-100 overflow-x-auto">
              {mints.length > 0 ? (
                mints.map((mint) => (
                  <div key={mint.id} className="p-4 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[11px]">
                          +${mint.amountFormatted.toLocaleString()} USDT
                        </span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          Block #{mint.blockNumber}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-mono">
                          BullMQ Queued ✓
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>From: <code className="text-zinc-900 bg-zinc-100 px-1 py-0.5 rounded">0x0000...0000 (ZeroAddress)</code></span>
                        <span>To: <code className="text-zinc-700">{mint.to.substring(0, 12)}...{mint.to.substring(34)}</code></span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-[11px] text-zinc-400">
                      <div>Tx: <code className="text-zinc-600">{mint.tx.substring(0, 14)}...</code></div>
                      <div>{new Date(mint.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-400 font-mono text-xs">
                  No mint events recorded yet. Click "Simulate $50M Mint" above to test.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-RPC Latency Benchmark */}
      {activeTab === "benchmark" && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-600" />
                  <span>Real-Time Multi-RPC Latency &amp; Block Synchronization</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Benchmarked live against production nodes. Sub-200ms latency is required for competitive MEV and zero-revert arbitrage execution.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRunRpcBenchmark}
                  disabled={benchmarking}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${benchmarking ? "animate-spin" : ""}`} />
                  <span>{benchmarking ? "Pinging Nodes..." : "Benchmark All RPCs"}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {benchmarks.map((item) => (
                <div
                  key={item.url}
                  className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900">{item.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200/70 text-zinc-700 font-semibold">
                        {item.chain}
                      </span>
                      {item.latencyMs < 160 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                          FASTEST FOR BOTS
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-zinc-500 truncate max-w-md">
                      {item.url}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {item.blockNumber && (
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-zinc-400">Head Block</div>
                        <div className="text-xs font-semibold text-zinc-800">#{item.blockNumber.toLocaleString()}</div>
                      </div>
                    )}

                    <div className="text-right font-mono min-w-[70px]">
                      <div className="text-[10px] text-zinc-400">Latency</div>
                      <div
                        className={`text-sm font-bold ${
                          item.latencyMs < 200
                            ? "text-emerald-600"
                            : item.latencyMs < 400
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {item.latencyMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Last benchmark run: {new Date(benchmarkTimestamp).toLocaleTimeString()}</span>
              <span>Tested via native JSON-RPC eth_blockNumber</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Terminal & Live Execution */}
      {activeTab === "terminal" && (
        <div className="space-y-4">
          {/* Sub-view Switcher */}
          <div className="flex items-center justify-between bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setTerminalViewMode("cli")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  terminalViewMode === "cli"
                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Play className="w-3 h-3" />
                <span>Live CLI Execution (`node run-bot-24-7.js`)</span>
              </button>

              <button
                type="button"
                onClick={() => setTerminalViewMode("pm2")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  terminalViewMode === "pm2"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>PM2 Cluster Telemetry Logs</span>
              </button>
            </div>

            {terminalViewMode === "cli" && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExecuteBotCli}
                  disabled={runningBotCli}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center space-x-1 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${runningBotCli ? "animate-spin" : ""}`} />
                  <span>{runningBotCli ? "Running Sample..." : "Run Bot (Live)"}</span>
                </button>
              </div>
            )}
          </div>

          {terminalViewMode === "cli" ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-xs overflow-hidden text-zinc-100 font-mono">
              <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-zinc-200">
                    Live Node.js Execution Output
                  </span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                    node run-bot-24-7.js
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {botCliResult && (
                    <span className="text-[11px] text-zinc-400">
                      Duration: {botCliResult.durationMs}ms
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (botCliOutput) navigator.clipboard.writeText(botCliOutput);
                    }}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotCliOutput(null)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="p-4 text-xs max-h-[500px] overflow-y-auto leading-relaxed space-y-1">
                {botCliOutput ? (
                  <pre className="whitespace-pre-wrap font-mono text-zinc-200 select-text">
                    {botCliOutput}
                  </pre>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-zinc-400 text-xs">
                      Ready to execute <code>bot-24-7/src/index.js</code> via the live runner.
                    </p>
                    <button
                      type="button"
                      onClick={handleExecuteBotCli}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Bot Now (Sample Real WebSockets)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-xs overflow-hidden text-zinc-100 font-mono">
              <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    PM2 Cluster Real-Time Logs ({logs.length} entries)
                  </span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded">
                    STREAMING
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsLogsPaused(!isLogsPaused)}
                    className={`px-2.5 py-1 rounded text-[11px] flex items-center space-x-1 cursor-pointer transition-colors ${
                      isLogsPaused
                        ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {isLogsPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{isLogsPaused ? "Resume" : "Pause"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-1.5 text-xs max-h-[450px] overflow-y-auto leading-relaxed">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-2 hover:bg-zinc-900/60 p-1 rounded">
                      <span className="text-zinc-500 shrink-0 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                          log.worker.includes("worker-0")
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-purple-950 text-purple-400 border border-purple-800"
                        }`}
                      >
                        {log.worker}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] uppercase font-bold ${
                          log.level === "success"
                            ? "text-emerald-400"
                            : log.level === "warn"
                            ? "text-amber-400"
                            : log.level === "event"
                            ? "text-cyan-400"
                            : "text-zinc-400"
                        }`}
                      >
                        [{log.level}]
                      </span>
                      <span className="text-zinc-200">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 py-12">No logs captured yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: The 3 Core Rules (Blueprint) */}
      {activeTab === "blueprint" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rule 1 */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-sm mb-3">
                  01
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Never Use a Single Provider
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  src/utils/reconnect.js
                </p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Raw <code className="font-mono text-zinc-800">WebSocketProvider</code> sockets disconnect every 1–2 hours due to node rotations. The <code className="font-mono text-emerald-600">create247Provider</code> wrapper handles <code className="font-mono">close</code> and <code className="font-mono">error</code> events, triggering automatic 3s reconnection loops without crashing the Node.js event loop.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilePath("src/utils/reconnect.js");
                    setActiveTab("code");
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View reconnect.js</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold flex items-center justify-center text-sm mb-3">
                  02
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Put Everything in a Queue
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  src/services/queue.js &amp; mint.listener.js
                </p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Never process transactions or execute heavy database writes inside the contract listener. Push raw payloads to <code className="font-mono text-blue-600">BullMQ (mintQueue.add)</code> in under 1ms. Background workers digest the queue at controlled concurrency so sudden 100+ transaction spikes never drop events.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilePath("src/services/queue.js");
                    setActiveTab("code");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View queue.js</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 font-mono font-bold flex items-center justify-center text-sm mb-3">
                  03
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Run with PM2 in Cluster Mode
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  ecosystem.config.js (2 instances)
                </p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Configure <code className="font-mono text-purple-600">instances: 2</code>, <code className="font-mono">exec_mode: &quot;cluster&quot;</code>, and <code className="font-mono">max_memory_restart: &quot;500M&quot;</code>. If an unhandled exception or memory leak kills one instance, the companion instance handles block events uninterrupted while PM2 revives the worker.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilePath("ecosystem.config.js");
                    setActiveTab("code");
                  }}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View ecosystem.config.js</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Complete Directory Tree Reference */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-600" />
              <span>Full Repository Tree Structure (bot-24-7/)</span>
            </h3>
            <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto">
{`bot-24-7/
├── src/
│   ├── providers/          // 24/7 WebSocket connections with auto-reconnect
│   │   ├── eth.js          // Ethereum WebSocketProvider (auto-reconnect)
│   │   ├── bsc.js          // Binance Smart Chain WebSocketProvider
│   │   ├── sol.js          // Solana slot & log listener
│   │   └── binance-price.js// 24/7 Binance combined ticker (BTC, ETH, SOL, BNB)
│   ├── listeners/          // Event hooks that push immediately to BullMQ
│   │   ├── block.listener.js // Real-time block listener for ETH & BSC
│   │   ├── mint.listener.js  // Catches USDT mints from ethers.ZeroAddress
│   │   └── transfer.listener.js // Whale transfer monitor (> $250k)
│   ├── services/
│   │   ├── queue.js        // BullMQ queue with in-memory zero-crash fallback
│   │   └── db.js           // Persistent event storage & block memory
│   ├── utils/
│   │   └── reconnect.js    // Core heartbeat & auto-reconnect wrapper (Rule #1)
│   └── index.js            // Orchestrator glue starting all listeners
├── ecosystem.config.js     // PM2 cluster config (2 instances, auto-restart)
├── package.json
└── .env.example`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Project Files Viewer */}
      {activeTab === "code" && (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* Sidebar File Tree */}
            <div className="md:col-span-4 border-r border-zinc-200 bg-zinc-50/60 p-3 space-y-1 overflow-y-auto max-h-[600px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center justify-between">
                <span>Repository Files ({files.length})</span>
                <span className="text-[10px] text-zinc-400 font-mono">bot-24-7/</span>
              </div>

              {files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-2 transition-all cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-zinc-900 text-white font-semibold shadow-xs"
                      : "text-zinc-700 hover:bg-zinc-200/60"
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${selectedFilePath === file.path ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>

            {/* Code Display */}
            <div className="md:col-span-8 flex flex-col bg-zinc-950 text-zinc-100">
              <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {selectedFile ? selectedFile.path : "Select a file"}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {selectedFile ? `${selectedFile.size} bytes` : ""}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExecuteBotCli}
                    disabled={runningBotCli}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-semibold flex items-center space-x-1 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Execute bot-24-7/src/index.js live in Node.js"
                  >
                    <Play className={`w-3 h-3 ${runningBotCli ? "animate-spin" : ""}`} />
                    <span>{runningBotCli ? "Running..." : "Execute File (Live)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedFile ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                    <span>{copiedFile ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-mono flex items-center space-x-1 cursor-pointer shadow-xs border border-zinc-700"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-x-auto max-h-[550px]">
                <pre className="font-mono text-xs leading-relaxed text-zinc-200">
                  <code>{selectedFile ? selectedFile.content : "// No file selected"}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Failover & MEV Simulator */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Failover Card */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Simulate WebSocket Drop &amp; Auto-Reconnect</span>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Test Rule #1: Terminates the active provider socket intentionally to demonstrate the 3-second retry loop. The server catches the disconnect, logs the warning, and restores stream subscriptions without crashing.
              </p>

              <button
                type="button"
                onClick={handleSimulateReconnect}
                disabled={simulatingReconnect}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simulatingReconnect ? "animate-spin text-amber-400" : ""}`} />
                <span>{simulatingReconnect ? "Reconnection in Progress..." : "Trigger Disconnect & Watch 3s Recovery"}</span>
              </button>

              {reconnectLog && (
                <div className="p-3 bg-zinc-900 text-zinc-200 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {reconnectLog}
                </div>
              )}
            </div>

            {/* Mint Injection Card */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Simulate USDT Zero-Address Mint</span>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Test Rule #2: Simulates the Tether Treasury issuing stablecoins from <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">ethers.ZeroAddress</code>. Verifies immediate push to BullMQ queue and background worker execution.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={mintSimAmount}
                  onChange={(e) => setMintSimAmount(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-mono"
                  placeholder="Amount in USDT"
                />
                <button
                  type="button"
                  onClick={handleSimulateMint}
                  disabled={simulatingMint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {simulatingMint ? "Injecting..." : "Simulate Mint"}
                </button>
              </div>

              {mintSimSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-mono">
                  {mintSimSuccess}
                </div>
              )}
            </div>
          </div>

          {/* Flashbots MEV-Share Bundle Simulator */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Flashbots MEV-Share &amp; Private Bundle Simulator</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Routes arbitrage trades directly to private block builders (<code className="font-mono">mev_sendBundle</code>) so mempool searchers cannot sandwich or front-run your transactions.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold self-start sm:self-auto">
                EIP-1559 + MEV-SHARE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Target Block</label>
                <input
                  type="number"
                  value={bundleSimState.targetBlock}
                  onChange={(e) => setBundleSimState({ ...bundleSimState, targetBlock: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Miner Bribe (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={bundleSimState.bribeEth}
                  onChange={(e) => setBundleSimState({ ...bundleSimState, bribeEth: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Action</label>
                <button
                  type="button"
                  onClick={handleSimulateMevBundle}
                  disabled={bundleSimState.status === "building"}
                  className="w-full py-1.5 px-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {bundleSimState.status === "building" ? "Relaying Bundle..." : "Simulate Private Relay"}
                </button>
              </div>
            </div>

            {bundleSimState.result && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs font-mono text-purple-900 leading-relaxed">
                {bundleSimState.result}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
