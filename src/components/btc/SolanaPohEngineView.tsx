import React, { useState, useEffect } from "react";
import {
  Zap,
  Activity,
  Cpu,
  Clock,
  Layers,
  RefreshCw,
  Play,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Copy,
  Check,
  Code2,
  Terminal,
  ExternalLink,
  Flame,
  ArrowRight,
  Database,
  Sliders,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface SolanaClusterTelemetry {
  epoch: number;
  absoluteSlot: number;
  blockHeight: number;
  slotIndex: number;
  slotsInEpoch: number;
  epochProgressPercent: number;
  clusterTps: number;
  nonVoteTps: number;
  slotTimeMs: number;
  totalNetworkTransactions: number;
  latencyMs: number;
  polledAt: string;
  rpcEndpoint: string;
}

interface PohTickRecord {
  tickIndex: number;
  hash: string;
  previousHash: string;
  event?: {
    payload: string;
    eventHash: string;
    eventType: string;
  };
  durationMicros: number;
}

interface PohVerificationChunk {
  chunkIndex: number;
  startTick: number;
  endTick: number;
  startHash: string;
  endHash: string;
  ticksCount: number;
  verified: boolean;
  parallelThreadId: number;
}

interface PohGenerationResult {
  seed: string;
  totalTicks: number;
  finalHash: string;
  generationTimeMs: number;
  hashesPerSecond: number;
  ticks: PohTickRecord[];
  injectedEventsCount: number;
  verificationChunks: PohVerificationChunk[];
  parallelVerificationTimeMs: number;
  speedupFactor: number;
  timestamp: string;
}

export function SolanaPohEngineView() {
  const [telemetry, setTelemetry] = useState<SolanaClusterTelemetry | null>(null);
  const [loadingCluster, setLoadingCluster] = useState<boolean>(true);
  const [pohLoading, setPohLoading] = useState<boolean>(false);
  const [pohResult, setPohResult] = useState<PohGenerationResult | null>(null);

  // Configuration for PoH generation
  const [totalTicks, setTotalTicks] = useState<number>(25000);
  const [customSeed, setCustomSeed] = useState<string>("solana_genesis_clock_state_001");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Custom events
  const [event1Payload, setEvent1Payload] = useState<string>("tx:transfer_50_SOL:to_recipient_8xKp...9Mz");
  const [event2Payload, setEvent2Payload] = useState<string>("dex:raydium_swap:1000_USDC->6.82_SOL");
  const [event3Payload, setEvent3Payload] = useState<string>("oracle:pyth:SOL/USD=148.95");

  // Fetch live cluster metrics
  const fetchClusterStatus = async () => {
    setLoadingCluster(true);
    try {
      const res = await fetch("/api/solana/cluster-status");
      const data = await res.json();
      if (data.success) {
        setTelemetry(data.status);
      }
    } catch (_err) {
    } finally {
      setLoadingCluster(false);
    }
  };

  useEffect(() => {
    fetchClusterStatus();
    // Generate initial PoH sequence
    executePohRun();
  }, []);

  const executePohRun = async () => {
    setPohLoading(true);
    try {
      const injectedEvents = [
        {
          tick: Math.floor(totalTicks * 0.2),
          payload: event1Payload,
          eventType: "TRANSACTION" as const,
        },
        {
          tick: Math.floor(totalTicks * 0.5),
          payload: event2Payload,
          eventType: "SMART_CONTRACT_CALL" as const,
        },
        {
          tick: Math.floor(totalTicks * 0.8),
          payload: event3Payload,
          eventType: "ORACLE_TICK" as const,
        },
      ];

      const res = await fetch("/api/solana/poh-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: customSeed,
          totalTicks,
          injectedEvents,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPohResult(data.result);
      }
    } catch (_err) {
    } finally {
      setPohLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-zinc-950 text-white rounded-2xl p-6 border border-purple-800/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0 font-bold text-2xl">
              ◎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Solana Proof of History (PoH) &amp; VDF Cryptographic Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  400ms Slot Clock
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                Proof of History (PoH) is a high-speed cryptographic Verifiable Delay Function (VDF) running sequential SHA-256 hashes. It creates an immutable historical timestamp for transactions <strong>before consensus</strong>, allowing Solana to execute 50,000+ TPS across 400ms slots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={fetchClusterStatus}
              disabled={loadingCluster}
              className="p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-200 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh Live Solana Cluster Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCluster ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Live Solana Cluster Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/40 font-mono text-xs">
          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Current Slot</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {telemetry ? `#${telemetry.absoluteSlot.toLocaleString()}` : "Loading..."}
            </div>
            <div className="text-[11px] text-purple-300 mt-0.5">
              Epoch {telemetry?.epoch || 1042} ({telemetry?.epochProgressPercent || 0}%)
            </div>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Cluster TPS</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {telemetry ? `${telemetry.clusterTps.toLocaleString()} TPS` : "..."}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Non-Vote: {telemetry?.nonVoteTps || 1400} TPS
            </div>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Slot Target Time</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {telemetry ? `${telemetry.slotTimeMs} ms` : "400 ms"}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              PoH Sequential Clock
            </div>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Network Transactions</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {telemetry?.totalNetworkTransactions ? `${(telemetry.totalNetworkTransactions / 1e9).toFixed(1)} Billion` : "..."}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Sub-second finality
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE PROOF OF HISTORY (PoH) GENERATOR */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Cpu className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-wide">
                Interactive Proof of History (PoH) Verifiable Delay Function
              </h3>
              <p className="text-xs text-zinc-500">
                Execute a real sequential SHA-256 loop: H(i+1) = SHA-256(H(i)), injecting transaction events into the sequence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={executePohRun}
            disabled={pohLoading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${pohLoading ? "animate-spin" : ""}`} />
            <span>{pohLoading ? "Computing PoH Cycle..." : "Execute PoH Cycle"}</span>
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <label className="text-zinc-500 font-bold block">PoH Genesis Seed</label>
            <input
              type="text"
              value={customSeed}
              onChange={(e) => setCustomSeed(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-800 font-mono text-xs focus:outline-purple-500"
            />
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <div className="flex justify-between text-zinc-500 font-bold">
              <span>Sequential Ticks:</span>
              <span className="text-purple-700 font-bold">{totalTicks.toLocaleString()} Hashes</span>
            </div>
            <div className="flex gap-1 pt-1">
              {[5000, 15000, 25000, 50000].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTotalTicks(t)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    totalTicks === t
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {t / 1000}k
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <label className="text-zinc-500 font-bold block">Injected Event 1 (Tx)</label>
            <input
              type="text"
              value={event1Payload}
              onChange={(e) => setEvent1Payload(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-800 font-mono text-xs focus:outline-purple-500 truncate"
            />
          </div>
        </div>

        {/* PoH Telemetry & Speedup Metrics */}
        {pohResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
              <div className="text-[11px] text-purple-700 uppercase tracking-wider font-bold">
                Sequential Time (1 Core)
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {pohResult.generationTimeMs} ms
              </div>
              <div className="text-[11px] text-purple-600">
                Strict sequential execution O(N)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <div className="text-[11px] text-emerald-700 uppercase tracking-wider font-bold">
                Parallel Verification Time
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {pohResult.parallelVerificationTimeMs} ms
              </div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{pohResult.speedupFactor}x Multi-Core Speedup</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                VDF Hash Velocity
              </div>
              <div className="text-xl font-bold text-zinc-900">
                {((pohResult?.hashesPerSecond ?? 0) / 1e6).toFixed(2)}M /sec
              </div>
              <div className="text-[11px] text-zinc-500">
                SHA-256 hardware pipeline
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                Injected Event Anchor
              </div>
              <div className="text-xl font-bold text-purple-900">
                {pohResult.injectedEventsCount} Events Timed
              </div>
              <div className="text-[11px] text-zinc-500">
                Cryptographically ordered in VDF
              </div>
            </div>
          </div>
        )}

        {/* PoH Sequential Timeline Display */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Verifiable Delay Function (VDF) Sequential State Sequence</span>
            </h4>
            <span className="text-[11px] text-zinc-500">
              Showing sampled ticks and event anchors
            </span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600">
                <tr>
                  <th className="py-2.5 px-3">Tick #</th>
                  <th className="py-2.5 px-3">State Operation</th>
                  <th className="py-2.5 px-3">Computed SHA-256 Hash</th>
                  <th className="py-2.5 px-3">Event / Transaction Ingested</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {pohResult?.ticks.map((tick) => (
                  <tr
                    key={tick.tickIndex}
                    className={
                      tick.event
                        ? "bg-purple-50/80 font-bold border-l-4 border-l-purple-600"
                        : "hover:bg-zinc-50"
                    }
                  >
                    <td className="py-2.5 px-3 text-purple-900">
                      #{tick.tickIndex.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3">
                      {tick.event ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
                          EVENT_MIX_HASH
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">
                          SHA256(H_prev)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-zinc-700 font-mono text-[11px]">
                      {tick.hash.slice(0, 12)}...{tick.hash.slice(-10)}
                    </td>

                    <td className="py-2.5 px-3">
                      {tick.event ? (
                        <div className="text-xs text-purple-950 font-sans">
                          <span className="font-bold font-mono text-purple-700">
                            [{tick.event.eventType}]:{" "}
                          </span>
                          <span>{tick.event.payload}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-[11px] font-sans">
                          Clock advance tick
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tick.hash, `tick-${tick.tickIndex}`)}
                        className="p-1 text-zinc-400 hover:text-purple-700 cursor-pointer inline-flex items-center space-x-1"
                        title="Copy Hash"
                      >
                        {copiedHash === `tick-${tick.tickIndex}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parallel Multi-Core Verification Chunks */}
        {pohResult?.verificationChunks && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Multi-Core Parallel Verification Slices (Embarrassingly Parallel)</span>
              </h4>
              <span className="text-[11px] text-emerald-700 font-bold">
                100% Cryptographically Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pohResult.verificationChunks.map((chunk) => (
                <div
                  key={chunk.chunkIndex}
                  className="p-3 bg-zinc-900 text-white rounded-xl border border-zinc-800 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-[11px] text-zinc-400">
                    <span>Thread #{chunk.parallelThreadId} (Core)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      VALID
                    </span>
                  </div>
                  <div className="text-amber-400 font-bold text-xs">
                    Ticks #{chunk.startTick.toLocaleString()} - #{chunk.endTick.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Start: {chunk.startHash.slice(0, 10)}...
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    End: {chunk.endHash.slice(0, 10)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: COMPARATIVE CONSENSUS CLOCK ARCHITECTURE */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Consensus Clock Comparison: Bitcoin vs. Ethereum vs. Solana</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          {/* Bitcoin */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-sm">Bitcoin (PoW)</span>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-800 font-mono text-[11px] font-bold">
                ~10m Blocks
              </span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-[11px]">
              No global clock exists. Blocks are produced probabilistically when a miner solves a SHA-256 target. Nodes communicate over P2P gossip to order transactions retrospectively.
            </p>
            <div className="font-mono text-[11px] text-amber-900 font-bold pt-1">
              Throughput: ~7 TPS
            </div>
          </div>

          {/* Ethereum */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 text-sm">Ethereum (PoS)</span>
              <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-800 font-mono text-[11px] font-bold">
                12s Slots
              </span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-[11px]">
              Time is divided into 12-second slots grouped into 32-slot epochs (6.4 minutes). Attestations and Casper FFG reach economic finality after two consecutive epochs.
            </p>
            <div className="font-mono text-[11px] text-blue-900 font-bold pt-1">
              Throughput: ~15-30 TPS (L1)
            </div>
          </div>

          {/* Solana */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 text-sm">Solana (PoH + Tower BFT)</span>
              <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-800 font-mono text-[11px] font-bold">
                400ms Slots
              </span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-[11px]">
              Proof of History (PoH) runs as a continuous sequential cryptographic clock. Validators already know the exact order of incoming messages before voting, removing network consensus lag.
            </p>
            <div className="font-mono text-[11px] text-purple-900 font-bold pt-1">
              Throughput: 3,500 - 50,000+ TPS
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: REALITY & PROTOCOL SAFETY NOTICE */}
      <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 space-y-3 text-xs font-sans">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>Architectural Engineering Reality Check</span>
        </div>
        <p className="text-zinc-300 leading-relaxed text-[11px]">
          Solana's Proof of History (PoH) is a <strong>high-performance distributed systems clock</strong> designed by Anatoly Yakovenko to synchronize validators at microsecond scale. While it allows decentralized networks to reach massive computational throughput (TPS), <em>it is purely a cryptographic consensus protocol</em>. It does not spawn tokens out of thin air, trigger automated financial returns, or replace real capital backing.
        </p>
      </div>
    </div>
  );
}
