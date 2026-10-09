import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Radio,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Zap,
  Boxes,
  Database,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Gauge,
  Timer,
  Sliders,
  Flame,
  Info,
} from "lucide-react";

interface MempoolStatistics {
  count: number;
  vsize: number;
  totalFeeSat: number;
  totalFeeBtc: number;
  totalFeeUsd: number;
  memoryUsageMb: number;
  maxMempoolMb: number;
  congestionLevel: "LOW" | "NORMAL" | "HIGH" | "SURGE";
  projectedBlocksToClear: number;
  feeHistogram: Array<{ satVb: number; txCount: number }>;
  recentTransactions: Array<{
    txid: string;
    fee: number;
    vsize: number;
    feeRate: number;
    valueSat: number;
    valueBtc: number;
  }>;
  polledAt: string;
  sourceEndpoint: string;
}

interface BlockLatencyMetrics {
  currentElapsedSeconds: number;
  targetIntervalSeconds: number;
  averageLatencySeconds: number;
  minLatencySeconds: number;
  maxLatencySeconds: number;
  latestBlockIntervalSeconds: number;
  hashratePace: "FASTER_THAN_TARGET" | "ON_TARGET" | "SLOWER_THAN_TARGET";
  blocks: Array<{
    height: number;
    id: string;
    timestamp: number;
    timestampFormatted: string;
    latencySeconds: number | null;
    latencyFormatted: string;
    txCount: number;
    sizeBytes: number;
    weight: number;
    speedTag: "RAPID" | "NORMAL" | "EXTENDED";
  }>;
  polledAt: string;
  sourceEndpoint: string;
}

interface BtcMempoolMonitorViewProps {
  network: "mainnet" | "testnet" | "signet";
  onNetworkChange?: (net: "mainnet" | "testnet" | "signet") => void;
}

export function BtcMempoolMonitorView({ network, onNetworkChange }: BtcMempoolMonitorViewProps) {
  // Service configuration
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(5);
  const [pollCount, setPollCount] = useState<number>(0);
  const [lastRoundTripMs, setLastRoundTripMs] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(5);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Monitor data
  const [mempoolData, setMempoolData] = useState<MempoolStatistics | null>(null);
  const [latencyData, setLatencyData] = useState<BlockLatencyMetrics | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ref to track tip block timestamp for continuous smooth ticking
  const tipTimestampRef = useRef<number | null>(null);

  // Fetch monitoring data
  const fetchMonitorData = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const start = Date.now();
      const res = await fetch(`/api/btc/mempool-monitor?network=${network}`);
      const data = await res.json();
      const rtt = Date.now() - start;
      setLastRoundTripMs(rtt);

      if (data.success) {
        setMempoolData(data.mempool);
        setLatencyData(data.blockLatency);
        setPollCount((prev) => prev + 1);
        setLastSyncTime(new Date());

        if (data.blockLatency?.blocks?.[0]?.timestamp) {
          tipTimestampRef.current = data.blockLatency.blocks[0].timestamp;
          const nowSec = Math.floor(Date.now() / 1000);
          setLiveElapsedSeconds(Math.max(0, nowSec - data.blockLatency.blocks[0].timestamp));
        }
      } else {
        setErrorMsg(data.error || "Failed to poll Esplora API");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error querying mempool service");
    } finally {
      setIsRefreshing(false);
      setCountdown(pollIntervalSec);
    }
  };

  // Initial fetch and on network / interval change
  useEffect(() => {
    fetchMonitorData();
  }, [network]);

  // Automated Polling Loop
  useEffect(() => {
    if (!isAutoPolling) return;

    const intervalTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMonitorData();
          return pollIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [isAutoPolling, pollIntervalSec, network]);

  // Live 1-second ticker for elapsed time since last block broadcast
  useEffect(() => {
    const tickTimer = setInterval(() => {
      if (tipTimestampRef.current) {
        const nowSec = Math.floor(Date.now() / 1000);
        setLiveElapsedSeconds(Math.max(0, nowSec - tipTimestampRef.current));
      } else {
        setLiveElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(tickTimer);
  }, []);

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCongestionBadge = (level?: string) => {
    switch (level) {
      case "LOW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Low Congestion</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">High Volume</span>;
      case "SURGE":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">Mempool Surge</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Normal Flow</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Automated Monitoring Control Bar */}
      <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-3.5 h-3.5 rounded-full ${isAutoPolling ? "bg-emerald-400" : "bg-amber-400"}`} />
              {isAutoPolling && (
                <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-wide uppercase font-mono">
                  Esplora Real-Time Mempool &amp; Block Monitor Service
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono border border-zinc-700">
                  {network.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Automated continuous listener polling unconfirmed transactions and block broadcast latency
              </p>
            </div>
          </div>

          {/* Controls: Play/Pause, Polling Frequency, Manual Poll */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Polling Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPolling(!isAutoPolling)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
                isAutoPolling
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              }`}
            >
              {isAutoPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoPolling ? "Auto-Poll: Active" : "Auto-Poll: Paused"}</span>
            </button>

            {/* Polling Interval Select */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-mono">
              <span className="text-zinc-500 text-[11px] px-2">Rate:</span>
              {[3, 5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setPollIntervalSec(sec);
                    setCountdown(sec);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    pollIntervalSec === sec
                      ? "bg-amber-500 text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Manual Poll Trigger */}
            <button
              type="button"
              onClick={fetchMonitorData}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
              <span>Poll Now</span>
            </button>
          </div>
        </div>

        {/* Telemetry Status Strip */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-zinc-400">
          <div>
            Sync Iterations: <span className="text-white font-bold">#{pollCount}</span>
          </div>
          <div>
            API Round-Trip: <span className="text-emerald-400 font-bold">{lastRoundTripMs} ms</span>
          </div>
          <div>
            Next Poll:{" "}
            <span className="text-amber-400 font-bold">
              {isAutoPolling ? `${countdown}s` : "Paused"}
            </span>
          </div>
          <div className="truncate">
            Last Sync:{" "}
            <span className="text-zinc-200">
              {lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Initializing..."}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: BLOCK BROADCAST LATENCY ANALYZER */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Timer className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-wide">
                Bitcoin Block Broadcast Latency Monitor
              </h3>
              <p className="text-xs text-zinc-500">
                Inter-block propagation delay and real-time elapsed counter compared against the 10-minute protocol target
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-zinc-500">Protocol Target:</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              10m 00s (600s)
            </span>
          </div>
        </div>

        {/* Latency Hero Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
          {/* Live Stopwatch Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-black text-white border border-zinc-800 space-y-2 relative overflow-hidden">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Since Last Block</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-400">
              {formatElapsed(liveElapsedSeconds)}
            </div>
            <div className="space-y-1">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    liveElapsedSeconds > 600 ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (liveElapsedSeconds / 600) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-400 flex justify-between">
                <span>0s</span>
                <span>Target: 10m</span>
              </div>
            </div>
          </div>

          {/* Average Latency */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Rolling Avg Latency
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {latencyData ? formatElapsed(latencyData.averageLatencySeconds) : "..."}
            </div>
            <div className="text-[11px] text-zinc-600 flex items-center space-x-1">
              {latencyData?.hashratePace === "FASTER_THAN_TARGET" ? (
                <span className="text-emerald-700 font-semibold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Faster than 10m target
                </span>
              ) : latencyData?.hashratePace === "SLOWER_THAN_TARGET" ? (
                <span className="text-amber-700 font-semibold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Slower than 10m target
                </span>
              ) : (
                <span className="text-blue-700 font-semibold">On Target (~10m)</span>
              )}
            </div>
          </div>

          {/* Latest Block Gap */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Latest Block Interval
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {latencyData ? formatElapsed(latencyData.latestBlockIntervalSeconds) : "..."}
            </div>
            <div className="text-[11px] text-zinc-500">
              Previous inter-block gap
            </div>
          </div>

          {/* Min & Max Variance */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Variance Window (Min / Max)
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1">
              <span className="text-emerald-700">
                {latencyData ? formatElapsed(latencyData.minLatencySeconds) : "--"}
              </span>{" "}
              /{" "}
              <span className="text-orange-700">
                {latencyData ? formatElapsed(latencyData.maxLatencySeconds) : "--"}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Poisson distribution range
            </div>
          </div>
        </div>

        {/* Recent Mined Blocks Broadcast Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-1.5">
              <Boxes className="w-4 h-4 text-amber-600" />
              <span>Consecutive Block Broadcast Intervals (Last 12 Mined Blocks)</span>
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono">
              Live from Esplora /v1/blocks
            </span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600">
                <tr>
                  <th className="py-2.5 px-3">Height</th>
                  <th className="py-2.5 px-3">Block Hash</th>
                  <th className="py-2.5 px-3">Broadcast Time</th>
                  <th className="py-2.5 px-3">Inter-Block Latency</th>
                  <th className="py-2.5 px-3">Transactions</th>
                  <th className="py-2.5 px-3">Size / Weight</th>
                  <th className="py-2.5 px-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {latencyData?.blocks?.map((block, idx) => {
                  return (
                    <tr
                      key={block.id}
                      className={idx === 0 ? "bg-amber-50/50 hover:bg-amber-50/80 font-bold" : "hover:bg-zinc-50"}
                    >
                      <td className="py-2.5 px-3 text-zinc-900">
                        <div className="flex items-center space-x-1.5">
                          {idx === 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Latest Tip Block" />
                          )}
                          <span>#{block.height.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-zinc-600 truncate max-w-[140px]" title={block.id}>
                        {block.id.slice(0, 10)}...{block.id.slice(-8)}
                      </td>

                      <td className="py-2.5 px-3 text-zinc-700 whitespace-nowrap">
                        {block.timestampFormatted}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {block.latencySeconds !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              block.speedTag === "RAPID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : block.speedTag === "EXTENDED"
                                ? "bg-orange-100 text-orange-800 border border-orange-300"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            +{block.latencyFormatted}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Benchmark Anchor</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-zinc-800">
                        {block.txCount.toLocaleString()} txs
                      </td>

                      <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                        {((block.sizeBytes ?? 0) / 1024 / 1024).toFixed(2)} MB /{" "}
                        {Math.round(((block.weight ?? 0) / 4000000) * 100)}%
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={`https://mempool.space/${network === "testnet" ? "testnet/" : network === "signet" ? "signet/" : ""}block/${block.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-900 underline"
                          title="Inspect Block on Mempool.space"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: REAL-TIME UNCONFIRMED TRANSACTION DATA (MEMPOOL STATS) */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
              <Database className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-wide">
                Real-Time Unconfirmed Transaction Data (Mempool Backlog)
              </h3>
              <p className="text-xs text-zinc-500">
                Pending unconfirmed transactions sitting in miners' mempools awaiting block inclusion
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getCongestionBadge(mempoolData?.congestionLevel)}
          </div>
        </div>

        {/* Mempool Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Total Count */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Unconfirmed Transactions
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {mempoolData ? `${mempoolData.count.toLocaleString()} txs` : "..."}
            </div>
            <div className="text-[11px] text-zinc-500">
              Pending cryptographic verification
            </div>
          </div>

          {/* Mempool Size & RAM Usage */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider flex justify-between">
              <span>Mempool Memory</span>
              <span className="text-zinc-700 font-bold">
                {mempoolData?.memoryUsageMb || 0} / 300 MB
              </span>
            </div>
            <div className="text-xl font-bold text-zinc-900">
              {mempoolData ? `${((mempoolData.vsize ?? 0) / 1024 / 1024).toFixed(1)} MB vB` : "..."}
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((mempoolData?.memoryUsageMb || 0) / 300) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Pending Fees in Mempool */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Total Pending Miner Fees
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {mempoolData ? `${(mempoolData.totalFeeBtc ?? 0).toFixed(4)} BTC` : "..."}
            </div>
            <div className="text-[11px] text-zinc-600 font-bold">
              ≈ ${mempoolData?.totalFeeUsd != null ? mempoolData.totalFeeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} USD
            </div>
          </div>

          {/* Projected Clearing Time */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Projected Backlog Clear
            </div>
            <div className="text-xl font-bold text-zinc-900">
              {mempoolData ? `~${mempoolData.projectedBlocksToClear} blocks` : "..."}
            </div>
            <div className="text-[11px] text-zinc-500">
              ≈{" "}
              {mempoolData
                ? `${Math.round((mempoolData.projectedBlocksToClear * 10) / 60)} hrs ${
                    (mempoolData.projectedBlocksToClear * 10) % 60
                  } mins`
                : "..."}
            </div>
          </div>
        </div>

        {/* Priority Fee Histogram (sat/vB tiers) */}
        {mempoolData?.feeHistogram && mempoolData.feeHistogram.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-900 text-white border border-zinc-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Gauge className="w-4 h-4" />
                <span>Mempool Fee Rate Distribution (sat/vB Tiers)</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                Transactions queued by bidding fee
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {mempoolData.feeHistogram.map((tier, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-[10px] text-zinc-400">Tier:</div>
                  <div className="text-amber-400 font-bold text-xs">
                    {tier.satVb} sat/vB
                  </div>
                  <div className="text-[11px] text-white font-mono">
                    {tier.txCount.toLocaleString()} txs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Stream of Unconfirmed Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Incoming Unconfirmed Transactions (Live Mempool Stream)</span>
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">
              Fetched via Esplora /mempool/recent
            </span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600">
                <tr>
                  <th className="py-2.5 px-3">TXID (Unconfirmed)</th>
                  <th className="py-2.5 px-3">Virtual Size (vB)</th>
                  <th className="py-2.5 px-3">Fee Rate</th>
                  <th className="py-2.5 px-3">Miner Fee</th>
                  <th className="py-2.5 px-3">Value Transferred</th>
                  <th className="py-2.5 px-3 text-right">Copy / Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {mempoolData?.recentTransactions?.map((tx) => (
                  <tr key={tx.txid} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-900 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="truncate max-w-[200px]" title={tx.txid}>
                          {tx.txid}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-zinc-600">{tx.vsize} vB</td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {tx.feeRate} sat/vB
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-zinc-800">
                      {tx.fee.toLocaleString()} sats
                    </td>

                    <td className="py-2.5 px-3 text-zinc-900 font-bold">
                      {(tx.valueBtc ?? 0).toFixed(4)} BTC
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tx.txid, tx.txid)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          title="Copy TXID"
                        >
                          {copiedId === tx.txid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`https://mempool.space/${network === "testnet" ? "testnet/" : network === "signet" ? "signet/" : ""}tx/${tx.txid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-zinc-400 hover:text-amber-700 cursor-pointer"
                          title="Open on Mempool.space"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: ARCHITECTURAL DEEP-DIVE & ESPLORA API DOCUMENTATION */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3 text-xs text-amber-950">
        <div className="flex items-center space-x-2 font-bold text-amber-900">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Esplora REST API Architecture &amp; Latency Mechanics</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-zinc-700 font-sans text-xs">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 space-y-1">
            <h5 className="font-bold text-zinc-900">1. Unconfirmed Mempool Buffering</h5>
            <p className="text-zinc-600 text-[11px] leading-relaxed">
              When a Bitcoin node receives an unconfirmed transaction over TCP port 8333, it runs script validation and adds it to its local RAM mempool. Esplora indexes these transactions in real time via an Electrum DB backend.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 space-y-1">
            <h5 className="font-bold text-zinc-900">2. Poisson Block Interval Distribution</h5>
            <p className="text-zinc-600 text-[11px] leading-relaxed">
              Bitcoin mining is a memoryless Poisson stochastic process. Even though the difficulty target is 10 minutes (600 seconds), actual intervals range from a few seconds to over an hour due to random nonce discovery.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 space-y-1">
            <h5 className="font-bold text-zinc-900">3. Sub-Second REST Querying</h5>
            <p className="text-zinc-600 text-[11px] leading-relaxed">
              Querying raw Bitcoin Core JSON-RPC (<code className="font-mono text-[10px]">getrawmempool</code>) can lock LevelDB during high congestion. Esplora REST serves cached, pre-indexed JSON payloads under 100ms round-trip latency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
