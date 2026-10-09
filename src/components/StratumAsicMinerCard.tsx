import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  Copy,
  Terminal,
  Shield,
  Flame,
  Fan,
  Play,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function StratumAsicMinerCard() {
  const [state, setState] = useState<any>({
    model: "Antminer S19 Pro",
    hashRateThs: 110.5,
    chipTempC: 72,
    fanSpeedRpm: 6250,
    workerName: "antminer_worker_1",
    sharesAccepted: 142,
    sharesRejected: 0,
    difficulty: 16384,
    jobId: "bf01",
    totalSatoshisMined: 485000,
    lastNonceFound: "0x4a8b2c1f",
    connectedClients: 0,
    isMining: true,
    port: 3333,
    activeAlgo: "SHA-256d: H(H(BlockHeader))",
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [miningAction, setMiningAction] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStateAndLogs = async () => {
    try {
      const [resState, resLogs] = await Promise.all([
        fetch("/api/stratum/state").catch(() => null),
        fetch("/api/stratum/logs").catch(() => null),
      ]);
      if (resState && resState.ok) {
        const contentType = resState.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const dataState = await resState.json().catch(() => null);
          if (dataState?.success && dataState.state) setState(dataState.state);
        }
      }
      if (resLogs && resLogs.ok) {
        const contentType = resLogs.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const dataLogs = await resLogs.json().catch(() => null);
          if (dataLogs?.success && dataLogs.logs) setLogs(dataLogs.logs);
        }
      }
    } catch (_e) {
      // Handled gracefully without polluting console
    }
  };

  useEffect(() => {
    fetchStateAndLogs();
    const interval = setInterval(fetchStateAndLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerMiningStep = async () => {
    setMiningAction(true);
    try {
      const res = await fetch("/api/stratum/mine-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          await fetchStateAndLogs();
        }
      }
    } catch (_e) {
      // Handled
    } finally {
      setMiningAction(false);
    }
  };

  const clearLogs = async () => {
    try {
      const res = await fetch("/api/stratum/clear-logs", { method: "POST" }).catch(() => null);
      if (res && res.ok) {
        await fetchStateAndLogs();
      }
    } catch (_e) {
      // Handled
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                Physical ASIC Miner Socket
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>TCP:3333 Stratum V1</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Antminer S19 Pro (110 TH/s) • bmminer/2.0.0 • SHA-256d: H(H(BlockHeader))
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={triggerMiningStep}
            disabled={miningAction}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {miningAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Find Nonce &amp; Submit Share</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard("stratum+tcp://127.0.0.1:3333", "stratum-local")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono flex items-center space-x-1 cursor-pointer transition-all"
            title="Copy local stratum URI"
          >
            {copiedKey === "stratum-local" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>stratum:3333</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard("stratum+tcp://100.64.12.89:3333", "stratum-mesh")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono flex items-center space-x-1 cursor-pointer transition-all"
            title="Copy Tailscale stratum URI"
          >
            {copiedKey === "stratum-mesh" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Tailscale:3333</span>
          </button>
        </div>
      </div>

      {/* ASIC Telemetry Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Hashrate</span>
          </div>
          <div className="text-sm font-black text-amber-300 font-mono">
            {state.hashRateThs} <span className="text-[10px] text-zinc-400 font-normal">TH/s</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Chip Temp</span>
          </div>
          <div className="text-sm font-black text-white font-mono">
            {state.chipTempC}°C <span className="text-[10px] text-emerald-400 font-bold">Optimal</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Fan className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Fan Speed</span>
          </div>
          <div className="text-sm font-black text-white font-mono">
            {state.fanSpeedRpm.toLocaleString()} <span className="text-[10px] text-zinc-400 font-normal">RPM</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Activity className="w-3 h-3 text-purple-400" />
            <span>Target Diff</span>
          </div>
          <div className="text-sm font-black text-purple-300 font-mono">
            {state.difficulty.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Shares</span>
          </div>
          <div className="text-sm font-black text-emerald-400 font-mono">
            {state.sharesAccepted} <span className="text-[10px] text-zinc-500 font-normal">/ 0 rej</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Mined SATs</span>
          </div>
          <div className="text-sm font-black text-amber-300 font-mono">
            {state.totalSatoshisMined.toLocaleString()} <span className="text-[10px] text-zinc-400">SAT</span>
          </div>
        </div>
      </div>

      {/* Live Stratum V1 Packet Stream Terminal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-zinc-300 font-bold">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Stratum V1 Wire Stream (TCP:3333 Socket Exchange)</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <button
              type="button"
              onClick={clearLogs}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Reset Stream
            </button>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full Duplex WireGuard/TCP</span>
            </span>
          </div>
        </div>

        <div className="bg-black/90 border border-zinc-800 rounded-xl p-3.5 font-mono text-[11px] max-h-72 overflow-y-auto space-y-1.5 shadow-inner">
          {logs.map((log, index) => {
            let textColor = "text-zinc-300";
            if (log.type === "init") textColor = "text-zinc-400 font-bold";
            if (log.type === "send") textColor = "text-cyan-400";
            if (log.type === "recv") textColor = "text-amber-300";
            if (log.type === "hash") textColor = "text-purple-300 font-bold";
            if (log.type === "golden") textColor = "text-amber-400 font-black bg-amber-950/40 p-1 rounded border border-amber-500/30";
            if (log.type === "accepted") textColor = "text-emerald-400 font-black bg-emerald-950/30 p-1 rounded border border-emerald-500/30";
            if (log.type === "error") textColor = "text-rose-400 font-bold";

            return (
              <div key={log.id || index} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`${textColor} break-all`}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Stratum Terminal Command Reference */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-1">
          <span className="text-zinc-400 block text-[11px] font-bold">
            Connect Physical ASIC or Terminal Client:
          </span>
          <code className="text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
            nc 127.0.0.1 3333
          </code>
          <span className="text-zinc-500 ml-2">or over Tailscale</span>
          <code className="text-cyan-300 bg-black/60 px-2 py-0.5 rounded border border-zinc-800 text-[11px] ml-1">
            nc 100.64.12.89 3333
          </code>
        </div>

        <button
          type="button"
          onClick={() => {
            const rawTrace = logs.map(l => `[${l.timestamp}] ${l.message}`).join("\n");
            copyToClipboard(rawTrace, "full-trace");
          }}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer transition-colors"
        >
          {copiedKey === "full-trace" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy Complete ASIC Log</span>
        </button>
      </div>
    </div>
  );
}
