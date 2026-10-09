import React, { useState } from "react";
import {
  X,
  Fuel,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Check,
  Copy,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Zap,
  Activity,
  Radio,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { ScannerAutomationState } from "../types";

interface RefillFrontPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasBalance: number;
  signerAddress: string;
  onRefillSuccess: (newBalance: number, message: string) => void;
  automationState?: ScannerAutomationState | null;
  onToggleAutomation?: () => void;
  onNavigateToScanner?: () => void;
}

export function RefillFrontPortModal({
  isOpen,
  onClose,
  gasBalance,
  signerAddress,
  onRefillSuccess,
  automationState,
  onToggleAutomation,
  onNavigateToScanner,
}: RefillFrontPortModalProps) {
  const [customAmount, setCustomAmount] = useState<string>("0.5");
  const [refilling, setRefilling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-refill settings
  const [autoRefillEnabled, setAutoRefillEnabled] = useState<boolean>(
    automationState?.autoRefillEnabled ?? true
  );
  const [autoRefillThreshold, setAutoRefillThreshold] = useState<string>(
    String(automationState?.autoRefillThresholdEth ?? 0.15)
  );
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(signerAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRefill = async (amount: number) => {
    setRefilling(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/scanner/refill-gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountEth: amount }),
      });
      const data = await res.json();
      if (data.success) {
        onRefillSuccess(data.newBalanceEth, data.message);
        setStatusMessage(data.message);
      }
    } catch (_err) {
      setStatusMessage("Failed to connect to refill service");
    } finally {
      setRefilling(false);
    }
  };

  const handleSaveAutoRefillConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/scanner/auto-refill-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: autoRefillEnabled,
          thresholdEth: parseFloat(autoRefillThreshold) || 0.15,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
      }
    } catch (_err) {
      setStatusMessage("Failed to update auto-refill configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const gasStatusColor =
    gasBalance > 0.3
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : gasBalance > 0.1
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-red-400 bg-red-500/10 border-red-500/30";

  return (
    <div
      id="refill-front-port-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="refill-front-port-modal-content"
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-white my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shadow-xs">
              <Fuel className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Port 1: Refill Front &amp; Gas Management Port
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE INTERCONNECT
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Top up gas reserves for bot signer wallet, 24/7 automation engine, and meme coin pools.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-refill-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Security Alert Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold block mb-0.5">
                Web3 Refill Security Notice:
              </strong>
              Only refill the <strong>Public Signer Address</strong> with ETH. Your <strong>PRIVATE_KEY</strong> remains isolated on the backend server for local signing. Never disclose, paste, or refill your private key anywhere.
            </div>
          </div>

          {/* Current Gas Reserve & Signer Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Box 1: Gas Reserve */}
            <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Active Gas Reserve
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {(gasBalance ?? 0.0056).toFixed(3)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">ETH</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${gasStatusColor}`}>
                  {gasBalance > 0.3 ? "Adequate Gas Reserve" : gasBalance > 0.1 ? "Low Gas Warning" : "Depleted — Refill Required"}
                </span>
                <span className="text-zinc-400 font-mono text-[10px]">
                  ~{Math.floor(gasBalance / 0.0035)} swaps
                </span>
              </div>
            </div>

            {/* Box 2: Public Signer Address */}
            <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Signer Public Target
                  </span>
                  <button
                    type="button"
                    id="btn-copy-address-modal"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied!" : "Copy Target"}</span>
                  </button>
                </div>
                <div className="p-2 bg-black/60 rounded border border-zinc-800 font-mono text-[11px] text-emerald-300 truncate select-all">
                  {signerAddress}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Private key secured in server memory</span>
              </div>
            </div>
          </div>

          {/* 1-Click Refill Actions */}
          <div className="p-4 bg-zinc-900/70 rounded-xl border border-zinc-800 space-y-3">
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Refill Front Actions:</span>
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                id="btn-modal-refill-02"
                onClick={() => handleExecuteRefill(0.2)}
                disabled={refilling}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 disabled:opacity-50 cursor-pointer transition-colors text-center"
              >
                <div className="font-bold text-white text-sm">+0.2 ETH</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Quick Refill</div>
              </button>

              <button
                type="button"
                id="btn-modal-refill-05"
                onClick={() => handleExecuteRefill(0.5)}
                disabled={refilling}
                className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono text-white border border-emerald-500 disabled:opacity-50 cursor-pointer transition-colors text-center shadow-xs"
              >
                <div className="font-bold text-white text-sm">+0.5 ETH</div>
                <div className="text-[10px] text-emerald-100 mt-0.5">Standard Top-Up</div>
              </button>

              <button
                type="button"
                id="btn-modal-refill-10"
                onClick={() => handleExecuteRefill(1.0)}
                disabled={refilling}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 disabled:opacity-50 cursor-pointer transition-colors text-center"
              >
                <div className="font-bold text-white text-sm">+1.0 ETH</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Heavy Reserve</div>
              </button>
            </div>

            {/* Custom Refill Input */}
            <div className="pt-2 flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  id="input-custom-refill"
                  type="number"
                  step="0.05"
                  min="0.01"
                  max="10"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom amount (ETH)"
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-zinc-500">ETH</span>
              </div>
              <button
                type="button"
                id="btn-custom-refill"
                onClick={() => handleExecuteRefill(parseFloat(customAmount) || 0.5)}
                disabled={refilling || !customAmount}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-zinc-700"
              >
                {refilling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Refill Custom"}
              </button>
            </div>

            {statusMessage && (
              <div className="p-2 bg-emerald-950/70 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Auto-Refill Guard Configuration */}
          <div className="p-4 bg-zinc-900/70 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend Auto-Refill Guard for 24/7 Scanner:</span>
              </span>
              <button
                type="button"
                id="toggle-auto-refill"
                onClick={() => setAutoRefillEnabled(!autoRefillEnabled)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer border ${
                  autoRefillEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {autoRefillEnabled ? "GUARD ACTIVE" : "GUARD DISABLED"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Trigger threshold (ETH):
                </label>
                <input
                  id="input-auto-threshold"
                  type="number"
                  step="0.01"
                  value={autoRefillThreshold}
                  onChange={(e) => setAutoRefillThreshold(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  id="btn-save-auto-refill"
                  onClick={handleSaveAutoRefillConfig}
                  disabled={savingConfig}
                  className="w-full py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 rounded-lg text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingConfig ? "Saving..." : "Save Guard Policy"}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              When gas drops below threshold, the backend automatically tops up +0.5 ETH so 24/7 scanning is never interrupted.
            </p>
          </div>

          {/* 24/7 Automation Interconnect Bar */}
          {automationState && (
            <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${automationState.isRunning ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`} />
                <span className="text-zinc-300">
                  Scanner 24/7 Automation State: <strong>{automationState.isRunning ? "ACTIVE" : "PAUSED"}</strong>
                </span>
                <span className="text-zinc-500">({automationState.totalTicks} ticks)</span>
              </div>
              <div className="flex items-center space-x-2">
                {onToggleAutomation && (
                  <button
                    type="button"
                    onClick={onToggleAutomation}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 text-[11px] cursor-pointer"
                  >
                    {automationState.isRunning ? "Pause Scanner" : "Resume Scanner"}
                  </button>
                )}
                {onNavigateToScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToScanner();
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Open Scanner
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Port 1: Refill Front Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close Port
          </button>
        </div>
      </div>
    </div>
  );
}
