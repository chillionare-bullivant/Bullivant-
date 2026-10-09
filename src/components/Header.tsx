import { Sparkles, CheckCircle2, AlertCircle, Terminal, Radio, Cpu, Fuel, Activity, ShieldCheck, Zap, Globe, Flame, Mic } from "lucide-react";
import type { ServerStatus } from "../types";

interface HeaderProps {
  status: ServerStatus | null;
  loading: boolean;
  activeModule?: string;
  onSelectModule?: (mod: any) => void;
  gasBalance?: number;
  automationRunning?: boolean;
  onOpenRefillPort?: () => void;
  onToggleScannerAutomation?: () => void;
}

export function Header({
  status,
  loading,
  activeModule,
  onSelectModule,
  gasBalance = 0.45,
  automationRunning = true,
  onOpenRefillPort,
  onToggleScannerAutomation,
}: HeaderProps) {
  const isKeyConfigured = status?.apiKeyConfigured;

  return (
    <header id="app-header" className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-mono text-sm font-semibold shadow-sm border border-zinc-800">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                {activeModule === "cybersecurity" ? "Cybersecurity Fundamentals & Defense Hub" : "DEX Arbitrage & 24/7 Bot Engine"}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeModule === "cybersecurity" ? "NIST CSF 2.0 • CIS 18" : "Web3 + Node.js"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              {activeModule === "cybersecurity"
                ? "CIA Triad • AES-256-GCM AEAD Lab • NIST 800-63B Entropy • AI SOC Copilot"
                : "Uniswap V3 × SushiSwap Scanner • PM2 & BullMQ 24/7 Multi-Chain Listeners"}
            </p>
          </div>
        </div>

        {/* Navigation Ports Hub: Connected Ports */}
        <div className="flex items-center space-x-2">
          {/* Mainnet Real Money Console Trigger */}
          <button
            id="nav-mainnet-live-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("mainnet-console");
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "mainnet-console"
                ? "bg-red-700 text-white border-red-800 shadow-xs font-bold"
                : "bg-red-50 hover:bg-red-100 text-red-700 border-red-300 shadow-2xs font-semibold"
            }`}
            title="Open Mainnet Real-Money Live Transaction Console"
          >
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-pulse" />
            <span className="hidden sm:inline">Mainnet:</span>
            <span className="font-bold">LIVE CAPITAL</span>
          </button>

          {/* Deliver Bag Home Quick Action */}
          <button
            id="nav-deliver-bag-home-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("deliver-bag-home");
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "deliver-bag-home"
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs font-bold"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs font-semibold"
            }`}
            title="Open Deliver The Bag Home & Auto-Sweep Guardrails"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Deliver Bag:</span>
            <span className="font-bold">AUTO-SWEEP</span>
          </button>

          {/* AI Voice Conversation Trigger */}
          <button
            id="nav-ai-voice-live-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("ai-voice");
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "ai-voice"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-700 shadow-xs font-bold"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300 shadow-2xs font-semibold"
            }`}
            title="Open Gemini Live AI Voice Conversation (gemini-3.8-live)"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span className="hidden sm:inline">AI Voice:</span>
            <span className="font-bold">LIVE API</span>
          </button>

          {/* Master Port & URL Hub Button */}
          <button
            id="nav-all-ports-url-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("ports-dashboard");
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "ports-dashboard"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs font-semibold"
            }`}
            title="Open Master Port & URL Dashboard"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ports &amp; URLs:</span>
            <span className="font-bold">15 Active</span>
          </button>

          {/* Port 1: Refill Front Port */}
          <button
            id="nav-port-refill-btn"
            type="button"
            onClick={onOpenRefillPort}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/30 transition-all cursor-pointer shadow-2xs"
            title="Open Port 1: Refill Front & Signer Gas Console"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Port 1 Refill:</span>
            <span className="font-bold">{(gasBalance ?? 0.0056).toFixed(2)} ETH</span>
            <span className="text-[10px] bg-amber-500 text-white px-1 py-0.2 rounded font-sans font-bold">+</span>
          </button>

          {/* Port 2: Scanner 24/7 Automation Port */}
          <button
            id="nav-port-scanner-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("dex-scanner");
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "dex-scanner"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700 shadow-2xs"
            }`}
            title="Navigate to Port 2: DEX Scanner & 24/7 Automation"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${automationRunning ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${automationRunning ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="hidden lg:inline text-[11px]">Port 2 Scanner:</span>
            <span className="font-bold text-[11px]">{automationRunning ? "24/7 LIVE" : "PAUSED"}</span>
          </button>

          {/* Port 3: Unified Vault Port */}
          <button
            id="nav-port-vault-btn"
            type="button"
            onClick={() => {
              if (onSelectModule) onSelectModule("vault-port");
            }}
            className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeModule === "vault-port"
                ? "bg-zinc-950 text-white border-zinc-900 shadow-xs"
                : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200"
            }`}
            title="Navigate to Port 3: Unified Smart Contract Vault Port"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline text-[11px]">Port 3:</span>
            <span className="font-semibold text-[11px]">Vault Port</span>
          </button>

          {/* Gemini Status Badge */}
          <div
            id="status-badge"
            className={`hidden sm:inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
              loading
                ? "bg-zinc-50 text-zinc-500 border-zinc-200"
                : isKeyConfigured
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {loading ? (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            ) : isKeyConfigured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="text-[11px]">
              {loading
                ? "..."
                : isKeyConfigured
                ? "AI Ready"
                : "No Key"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

