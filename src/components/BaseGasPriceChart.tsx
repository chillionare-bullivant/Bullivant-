import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Fuel,
  Activity,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Zap,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Cpu,
} from "lucide-react";

export interface GasHistoryPoint {
  blockNumber: number;
  baseFeeGwei: number;
  priorityFeeGwei: number;
  totalGasPriceGwei: number;
  gasUsedRatio: number;
  estimatedTxCostUsd: number;
  timestamp: string;
}

export interface GasHistoryApiResponse {
  success: boolean;
  network: string;
  providerType: string;
  alchemySdkVersion: string;
  latencyMs: number;
  currentGasPriceGwei: number;
  averageGasPriceGwei: number;
  minGasPriceGwei: number;
  maxGasPriceGwei: number;
  congestionLevel: "Low" | "Moderate" | "Elevated" | "Congested";
  flashLoanGasCostUsd: number;
  flashLoanGasCostEth: number;
  standardTxCostUsd: number;
  history: GasHistoryPoint[];
  alchemyStatus?: string;
  alchemyNotice?: string | null;
  error?: string;
}

interface BaseGasPriceChartProps {
  className?: string;
  compact?: boolean;
}

export function BaseGasPriceChart({ className = "", compact = false }: BaseGasPriceChartProps) {
  const [data, setData] = useState<GasHistoryApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blockCount, setBlockCount] = useState<number>(24);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<GasHistoryPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchGasHistory = async (count: number = blockCount, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/base/gas-history?blocks=${count}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: GasHistoryApiResponse = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load Base gas history");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to query Alchemy Base gas oracle");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasHistory(blockCount, false);
  }, [blockCount]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchGasHistory(blockCount, true);
    }, 4000); // 4-second poll interval (~2 Base blocks)
    return () => clearInterval(interval);
  }, [autoRefresh, blockCount]);

  // Chart Dimensions & Scales
  const chartHeight = compact ? 180 : 230;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };

  const history = useMemo(() => data?.history || [], [data]);

  const { points, linePath, areaPath, avgY, minYVal, maxYVal } = useMemo(() => {
    if (!history.length) {
      return { points: [], linePath: "", areaPath: "", avgY: 0, minYVal: 0, maxYVal: 0 };
    }

    const prices = history.map((d) => d.totalGasPriceGwei);
    let minP = Math.min(...prices);
    let maxP = Math.max(...prices);

    // Provide a small margin so flat lines don't collide with borders
    if (minP === maxP) {
      minP = Math.max(0, minP - 0.001);
      maxP = maxP + 0.001;
    } else {
      const diff = maxP - minP;
      minP = Math.max(0, minP - diff * 0.15);
      maxP = maxP + diff * 0.15;
    }

    // Reference width for SVG viewBox calculation
    const svgWidth = 720;
    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const calcX = (index: number) => {
      if (history.length <= 1) return padding.left + plotWidth / 2;
      return padding.left + (index / (history.length - 1)) * plotWidth;
    };

    const calcY = (val: number) => {
      const normalized = (val - minP) / (maxP - minP || 1);
      return chartHeight - padding.bottom - normalized * plotHeight;
    };

    const pts = history.map((d, i) => ({
      x: calcX(i),
      y: calcY(d.totalGasPriceGwei),
      data: d,
    }));

    // SVG Line Path
    const dPath = pts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    // SVG Area Path
    const bottomY = chartHeight - padding.bottom;
    const aPath = `${dPath} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`;

    const averagePrice = data?.averageGasPriceGwei || (minP + maxP) / 2;
    const calculatedAvgY = calcY(averagePrice);

    return {
      points: pts,
      linePath: dPath,
      areaPath: aPath,
      avgY: calculatedAvgY,
      minYVal: minP,
      maxYVal: maxP,
    };
  }, [history, chartHeight, data?.averageGasPriceGwei]);

  // Congestion Theme colors
  const congestionBadge = useMemo(() => {
    switch (data?.congestionLevel) {
      case "Congested":
        return { text: "Congested", bg: "bg-red-500/20", border: "border-red-500/40", color: "text-red-400" };
      case "Elevated":
        return { text: "Elevated", bg: "bg-amber-500/20", border: "border-amber-500/40", color: "text-amber-400" };
      case "Moderate":
        return { text: "Moderate", bg: "bg-cyan-500/20", border: "border-cyan-500/40", color: "text-cyan-400" };
      default:
        return { text: "Low (Sub-Cent)", bg: "bg-emerald-500/20", border: "border-emerald-500/40", color: "text-emerald-400" };
    }
  }, [data?.congestionLevel]);

  return (
    <div
      id="base-gas-historical-chart-card"
      className={`bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/30 flex items-center space-x-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>BASE GAS ORACLE</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono text-[11px] font-medium border border-blue-500/30 flex items-center space-x-1" title={data?.alchemyNotice || undefined}>
              <Cpu className="w-3 h-3" />
              <span>{data?.providerType || "Base Mainnet Gateway"}</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${congestionBadge.bg} ${congestionBadge.border} ${congestionBadge.color}`}>
              {congestionBadge.text}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>Historical Gas Price Fluctuations on Base (Gwei)</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Live sub-second telemetry from Base Layer-2 (Chain ID 8453). Displays base fee + priority tips across recent blocks to optimize flash loan arbitrage execution.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Block window selector */}
          <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-xs font-mono">
            {[12, 24, 48].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBlockCount(count)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  blockCount === count
                    ? "bg-emerald-500 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {count}b
              </button>
            ))}
          </div>

          {/* Auto Refresh toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 border transition-all cursor-pointer ${
              autoRefresh
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
            title="Auto-refresh every 4 seconds (~2 Base blocks)"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
            <span>{autoRefresh ? "Live 4s" : "Paused"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchGasHistory(blockCount, false)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Gas Oracle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Key Market Condition Summary Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 my-4">
        {/* Current Gas Price */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Current Gas</span>
            {data && (
              data.currentGasPriceGwei <= data.averageGasPriceGwei ? (
                <span className="text-emerald-400 flex items-center text-[10px]">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Favorable
                </span>
              ) : (
                <span className="text-amber-400 flex items-center text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> High
                </span>
              )
            )}
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            {data?.currentGasPriceGwei !== undefined ? `${data.currentGasPriceGwei.toFixed(4)} Gwei` : "Loading..."}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Avg: {data?.averageGasPriceGwei?.toFixed(4) || "—"} Gwei
          </div>
        </div>

        {/* Flash Loan Cost (450,000 Gas) */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Flash Loan Fee</span>
            <span className="text-zinc-500 font-mono text-[9px]">450k Gas</span>
          </div>
          <div className="text-lg font-black text-cyan-400 font-mono mt-1">
            {data?.flashLoanGasCostUsd !== undefined ? `$${data.flashLoanGasCostUsd.toFixed(4)}` : "—"}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {data?.flashLoanGasCostEth ? `${data.flashLoanGasCostEth.toFixed(7)} ETH` : "—"}
          </div>
        </div>

        {/* Standard 21k Transfer Cost */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Transfer Fee</span>
            <span className="text-zinc-500 font-mono text-[9px]">21k Gas</span>
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            {data?.standardTxCostUsd !== undefined ? `$${data.standardTxCostUsd.toFixed(5)}` : "—"}
          </div>
          <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
            Fraction of a cent
          </div>
        </div>

        {/* Range Min / Max */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            Range ({blockCount} Blocks)
          </div>
          <div className="text-sm font-bold text-zinc-200 font-mono mt-1.5 flex items-center justify-between">
            <span className="text-emerald-400 text-xs">▼ {data?.minGasPriceGwei?.toFixed(4) || "—"}</span>
            <span className="text-amber-400 text-xs">▲ {data?.maxGasPriceGwei?.toFixed(4) || "—"}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Min &amp; Max in window
          </div>
        </div>

        {/* Oracle Provider & Latency */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Oracle Provider</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xs font-bold text-zinc-200 font-mono mt-1.5 truncate" title={data?.providerType || "Connecting..."}>
            {data?.providerType || "Alchemy Base RPC"}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Latency: {data?.latencyMs || 0}ms</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative z-10 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">Querying Alchemy Base historical gas oracle...</p>
          </div>
        )}

        {error && !data && (
          <div className="text-center py-12 space-y-2">
            <p className="text-xs text-red-400 font-mono">Failed to fetch gas price history: {error}</p>
            <button
              type="button"
              onClick={() => fetchGasHistory(blockCount, false)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Base Gas Price (Base Fee + Tip in Gwei)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-zinc-500 border-t border-dashed border-zinc-400 inline-block" />
                <span>Window Avg: {data.averageGasPriceGwei.toFixed(4)} Gwei</span>
              </span>
            </div>

            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 720 ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverPos(null);
                }}
              >
                <defs>
                  {/* Linear Gradient for area fill */}
                  <linearGradient id="gasPriceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Gradient for the line stroke */}
                  <linearGradient id="gasPriceLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="70%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
                  const gweiVal = (maxYVal - (maxYVal - minYVal) * ratio).toFixed(4);
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={720 - padding.right}
                        y2={y}
                        stroke="#27272a"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {gweiVal}
                      </text>
                    </g>
                  );
                })}

                {/* Average Reference Line */}
                {avgY >= padding.top && avgY <= chartHeight - padding.bottom && (
                  <line
                    x1={padding.left}
                    y1={avgY}
                    x2={720 - padding.right}
                    y2={avgY}
                    stroke="#a1a1aa"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                )}

                {/* Area Gradient Fill */}
                {areaPath && (
                  <path d={areaPath} fill="url(#gasPriceAreaGradient)" />
                )}

                {/* Main Curve Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#gasPriceLineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {points.map((pt, i) => {
                  const isHovered = hoveredPoint?.blockNumber === pt.data.blockNumber;
                  return (
                    <g key={i}>
                      {/* Invisible larger hover target */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredPoint(pt.data);
                          setHoverPos({ x: pt.x, y: pt.y });
                        }}
                      />
                      {/* Visible Node Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "5.5" : "2.5"}
                        fill={isHovered ? "#34d399" : "#10b981"}
                        stroke="#09090b"
                        strokeWidth={isHovered ? "2.5" : "1.5"}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* X-axis Labels */}
                {points.length > 0 && [
                  points[0],
                  points[Math.floor(points.length / 2)],
                  points[points.length - 1],
                ].map((pt, idx) => {
                  if (!pt) return null;
                  const label = pt.data.timestamp;
                  const blockStr = `#${pt.data.blockNumber}`;
                  return (
                    <g key={idx} transform={`translate(${pt.x}, ${chartHeight - 12})`}>
                      <text
                        x="0"
                        y="0"
                        fill="#a1a1aa"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {label} ({blockStr.slice(-4)})
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip Box */}
              {hoveredPoint && hoverPos && (
                <div
                  className="absolute pointer-events-none bg-zinc-950/95 border border-emerald-500/50 rounded-xl p-2.5 text-xs font-mono shadow-2xl z-20 space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
                  style={{
                    left: `${(hoverPos.x / 720) * 100}%`,
                    top: `${(hoverPos.y / chartHeight) * 100}%`,
                  }}
                >
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] border-b border-zinc-800 pb-1 gap-3">
                    <span>Block #{hoveredPoint.blockNumber}</span>
                    <span className="text-zinc-500">{hoveredPoint.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-400">Total Gas Price:</span>
                    <strong className="text-emerald-400 font-bold">{hoveredPoint.totalGasPriceGwei.toFixed(4)} Gwei</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="text-zinc-500">Base Fee:</span>
                    <span className="text-zinc-300">{hoveredPoint.baseFeeGwei.toFixed(4)} Gwei</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="text-zinc-500">Priority Tip:</span>
                    <span className="text-cyan-400">+{hoveredPoint.priorityFeeGwei.toFixed(4)} Gwei</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="text-zinc-500">Block Used:</span>
                    <span className="text-zinc-300">{hoveredPoint.gasUsedRatio}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-1">
                    <span>Transfer Cost:</span>
                    <span className="text-white">${hoveredPoint.estimatedTxCostUsd.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sub-second Execution & Arbitrage Advice */}
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400 font-sans">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Market Condition:</strong> Base is currently operating at <strong>{data?.currentGasPriceGwei || 0.006} Gwei</strong>.
            Flash loan arbitrage gas cost is <strong>&lt; $0.01 USD</strong> per 450k-gas swap.
          </span>
        </div>
        <div className="font-mono text-[11px] text-zinc-400">
          Target Blocks: <span className="text-emerald-400 font-bold">~200ms Flashblocks</span>
        </div>
      </div>
    </div>
  );
}
