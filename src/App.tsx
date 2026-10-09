import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { RequestRunner } from "./components/RequestRunner";
import { SetupGuide } from "./components/SetupGuide";
import { HttpServerDemo } from "./components/HttpServerDemo";
import { CliExpressDemo } from "./components/CliExpressDemo";
import { GeminiStreamDemo } from "./components/GeminiStreamDemo";
import { GeminiChatDemo } from "./components/GeminiChatDemo";
import { GeminiStructuredDemo } from "./components/GeminiStructuredDemo";
import { ScriptRunnerTerminal } from "./components/ScriptRunnerTerminal";
import { AsyncFsDemo } from "./components/AsyncFsDemo";
import { VariablesFunctionsDemo } from "./components/VariablesFunctionsDemo";
import { ObjectsArraysDemo } from "./components/ObjectsArraysDemo";
import { AsyncJsDemo } from "./components/AsyncJsDemo";
import { JsConceptsSummaryCard } from "./components/JsConceptsSummaryCard";
import { DexPriceScannerDemo } from "./components/DexPriceScannerDemo";
import { Bot247BlueprintView } from "./components/Bot247BlueprintView";
import { StealthFlashLoanView } from "./components/StealthFlashLoanView";
import { BullivantEngineView } from "./components/BullivantEngineView";
import { TetherMintActivationView } from "./components/TetherMintActivationView";
import { UnifiedVaultPortView } from "./components/UnifiedVaultPortView";
import { CybersecurityHubView } from "./components/CybersecurityHubView";
import { BtcArchitectureView } from "./components/BtcArchitectureView";
import { NodeIntelligenceBlockNetworkView } from "./components/NodeIntelligenceBlockNetworkView";
import { TriProtocolP2PConsole } from "./components/TriProtocolP2PConsole";
import { SmartContractVmStudio } from "./components/SmartContractVmStudio";
import { Level2RuntimeStudio } from "./components/Level2RuntimeStudio";
import { TerminalPtyStudio } from "./components/TerminalPtyStudio";
import { PortUrlDashboard } from "./components/PortUrlDashboard";
import { MainnetRealMoneyConsole } from "./components/MainnetRealMoneyConsole";
import { RefillFrontPortModal } from "./components/RefillFrontPortModal";
import { GeminiLiveVoiceView } from "./components/GeminiLiveVoiceView";
import { DeliverTheBagHomeView } from "./components/DeliverTheBagHomeView";
import { VpsDeploymentLaunchpadView } from "./components/VpsDeploymentLaunchpadView";
import { NextJsImplementationView } from "./components/NextJsImplementationView";
import { BaseGasPriceChart } from "./components/BaseGasPriceChart";
import { BaseFlashLoanDashboard } from "./components/BaseFlashLoanDashboard";
import type { ServerStatus, ScannerAutomationState } from "./types";
import {
  Brain,
  CheckCircle2,
  PackageCheck,
  Server,
  Sparkles,
  Terminal,
  Zap,
  MessageSquare,
  FileJson,
  FileCode,
  Layers,
  Activity,
  Radio,
  EyeOff,
  Music,
  Building2,
  ShieldCheck,
  Wallet,
  Lock,
  Fuel,
  Code2,
  Bug,
  Globe,
  Flame,
  Mic,
} from "lucide-react";

export default function App() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [activeModule, setActiveModule] = useState<
    | "base-flashloan"
    | "nextjs-implementation"
    | "vps-launchpad"
    | "deliver-bag-home"
    | "ai-voice"
    | "mainnet-console"
    | "ports-dashboard"
    | "terminal-pty"
    | "level2-runtime"
    | "smart-contracts-vm"
    | "tri-protocol-p2p"
    | "node-intelligence"
    | "btc-architecture"
    | "cybersecurity"
    | "vault-port"
    | "tether-mint"
    | "stealth-bot"
    | "bullivant"
    | "dex-scanner"
    | "bot-24-7"
    | "all"
    | "terminal"
    | "gemini"
    | "node-core"
    | "docs"
  >("base-flashloan");
  const [geminiSubTab, setGeminiSubTab] = useState<"voice" | "standard" | "streaming" | "chat" | "structured">("voice");

  // Three Ports State: Port 1 (Refill Front), Port 2 (Scanner 24/7 Automation), Port 3 (Unified Vault)
  const [gasBalance, setGasBalance] = useState<number>(0.0056);
  const [signerAddress, setSignerAddress] = useState<string>("0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD");
  const [automationState, setAutomationState] = useState<ScannerAutomationState | null>(null);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [showGasChart, setShowGasChart] = useState<boolean>(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/status").catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data) setStatus(data);
        }
      } catch (_err) {
        // Fallback status during server startup
      } finally {
        setLoadingStatus(false);
      }
    }
    checkStatus();
    fetchAutomation();

    const interval = setInterval(() => {
      fetchAutomation();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchAutomation = async () => {
    try {
      const res = await fetch("/api/scanner/automation-state").catch(() => null);
      if (!res || !res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        if (data.state) setAutomationState(data.state);
        if (data.gasBalanceEth !== undefined && data.gasBalanceEth !== null && !isNaN(Number(data.gasBalanceEth))) {
          setGasBalance(Number(data.gasBalanceEth));
        }
        if (data.signerAddress) setSignerAddress(data.signerAddress);
      }
    } catch (_err) {
      // Handled gracefully
    }
  };

  const handleToggleAutomation = async () => {
    try {
      const res = await fetch("/api/scanner/automation-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => null);
      if (!res || !res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setAutomationState((prev) =>
          prev ? { ...prev, isRunning: data.isRunning } : null
        );
      }
    } catch (_err) {
      // Handled gracefully
    }
  };

  const hasApiKey = Boolean(status?.apiKeyConfigured);

  return (
    <div id="app-root" className="min-h-screen bg-zinc-100/60 text-zinc-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header
        status={status}
        loading={loadingStatus}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        gasBalance={gasBalance}
        automationRunning={automationState?.isRunning ?? true}
        onOpenRefillPort={() => setIsRefillModalOpen(true)}
        onToggleScannerAutomation={handleToggleAutomation}
      />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Three Ports Quick-Access & System Synchronization Hub */}
        <div id="three-ports-interconnect-hub" className="bg-white border border-zinc-200/90 rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-zinc-950 text-emerald-400 rounded-lg font-mono text-xs font-bold border border-zinc-800 shadow-xs">
                3P
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    Three Ports Interconnect: Refill Front • Navigation • Scanner 24/7 Automation
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Full-stack state sync: Refill Front port manages signer gas, Navigation port routes views, and Scanner 24/7 automation monitors multi-chain DEX mempools.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Port 1: Refill Front Action */}
              <button
                type="button"
                id="three-ports-refill-trigger"
                onClick={() => setIsRefillModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/30 font-mono text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                <span>Port 1: Refill Front</span>
                <span className="font-bold text-amber-900">({(gasBalance ?? 0.0056).toFixed(2)} ETH)</span>
              </button>

              {/* Port 2: Scanner 24/7 Automation Action */}
              <button
                type="button"
                id="three-ports-scanner-trigger"
                onClick={() => setActiveModule("dex-scanner")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors border ${
                  activeModule === "dex-scanner"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Port 2: Scanner 24/7</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-1 rounded font-bold">
                  {automationState?.isRunning ? "24/7 ACTIVE" : "PAUSED"}
                </span>
              </button>

              {/* Port 3: Unified Vault Port Action */}
              <button
                type="button"
                id="three-ports-vault-trigger"
                onClick={() => setActiveModule("vault-port")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors border ${
                  activeModule === "vault-port"
                    ? "bg-zinc-950 text-white border-zinc-900 shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Port 3: Vault Port</span>
                <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1 rounded font-bold">PROTECTED</span>
              </button>

              {/* Master Port & URL Hub Action */}
              <button
                type="button"
                id="three-ports-ports-dashboard-trigger"
                onClick={() => setActiveModule("ports-dashboard")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors border ${
                  activeModule === "ports-dashboard"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>All Ports &amp; URLs</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-1 rounded font-bold">15 ACTIVE</span>
              </button>

              {/* Base Gas Oracle Chart Toggle */}
              <button
                type="button"
                id="three-ports-gas-chart-trigger"
                onClick={() => setShowGasChart(!showGasChart)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors border ${
                  showGasChart
                    ? "bg-zinc-950 text-emerald-400 border-zinc-800 shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                }`}
                title="Toggle Base Gas Price Historical Line Chart"
              >
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base Gas Oracle</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">
                  {showGasChart ? "VISIBLE" : "HIDDEN"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Base Gas Price Historical Line Chart Card */}
        {showGasChart && (
          <BaseGasPriceChart />
        )}

        {/* Navigation / Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <button
              id="module-base-flashloan-btn"
              type="button"
              onClick={() => setActiveModule("base-flashloan")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "base-flashloan"
                  ? "bg-blue-600 text-white shadow-xs font-bold border border-blue-500"
                  : "text-zinc-900 hover:text-black bg-white border border-blue-300 shadow-2xs font-semibold"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-bold">Base Flash Loan</span>
              <span className="text-[10px] bg-yellow-400/20 text-yellow-900 px-1.5 py-0.2 rounded font-mono font-bold">
                Aave V3
              </span>
            </button>

            <button
              id="module-nextjs-btn"
              type="button"
              onClick={() => setActiveModule("nextjs-implementation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "nextjs-implementation"
                  ? "bg-black text-white shadow-xs font-bold border border-zinc-700"
                  : "text-zinc-900 hover:text-black bg-white border border-blue-400/90 shadow-2xs font-semibold"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold">Next.js 14 App Router</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                Alchemy • Base
              </span>
            </button>

            <button
              id="module-vps-launchpad-btn"
              type="button"
              onClick={() => setActiveModule("vps-launchpad")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "vps-launchpad"
                  ? "bg-cyan-700 text-white shadow-xs font-bold"
                  : "text-cyan-800 hover:text-cyan-950 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 shadow-2xs font-semibold"
              }`}
            >
              <Server className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-bold">VPS Production Deploy</span>
              <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                5-STEP LAUNCHPAD
              </span>
            </button>

            <button
              id="module-deliver-bag-home-btn"
              type="button"
              onClick={() => setActiveModule("deliver-bag-home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "deliver-bag-home"
                  ? "bg-emerald-700 text-white shadow-xs font-bold"
                  : "text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-2xs font-semibold"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-bold">Deliver The Bag Home</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                AUTO-SWEEP
              </span>
            </button>

            <button
              id="module-ai-voice-btn"
              type="button"
              onClick={() => setActiveModule("ai-voice")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "ai-voice"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                  : "text-indigo-800 hover:text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-300 shadow-2xs font-semibold"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span className="font-bold">AI Voice (Gemini Live)</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-800 px-1.5 py-0.2 rounded font-mono font-bold">
                gemini-3.8-live
              </span>
            </button>

            <button
              id="module-mainnet-console-btn"
              type="button"
              onClick={() => setActiveModule("mainnet-console")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "mainnet-console"
                  ? "bg-red-700 text-white shadow-xs font-bold"
                  : "text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-300 shadow-2xs font-semibold"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-pulse" />
              <span className="font-bold">Mainnet Live Console</span>
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                REAL MONEY
              </span>
            </button>

            <button
              id="module-ports-dashboard-btn"
              type="button"
              onClick={() => setActiveModule("ports-dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "ports-dashboard"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-zinc-800 hover:text-zinc-950 bg-white border border-emerald-400/90 shadow-2xs"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold">Port &amp; URL Master Hub</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                EVERY PORT &amp; URL
              </span>
            </button>

            <button
              id="module-terminal-pty-btn"
              type="button"
              onClick={() => setActiveModule("terminal-pty")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "terminal-pty"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-sky-400/90 shadow-2xs"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-semibold">PTY Web Terminal</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-700 px-1.5 py-0.2 rounded font-mono font-bold">
                @xterm/xterm • ws
              </span>
            </button>

            <button
              id="module-level2-runtime-btn"
              type="button"
              onClick={() => setActiveModule("level2-runtime")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "level2-runtime"
                  ? "bg-indigo-900 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-indigo-400/90 shadow-2xs"
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold">Level 2: Active Runtime</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold">
                AST • SSE • Breakpoints
              </span>
            </button>

            <button
              id="module-smart-contracts-vm-btn"
              type="button"
              onClick={() => setActiveModule("smart-contracts-vm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "smart-contracts-vm"
                  ? "bg-purple-900 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-purple-400/90 shadow-2xs"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-semibold">VM Smart Contracts</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-700 px-1.5 py-0.2 rounded font-mono font-bold">
                Node.js vm • Gas Limit
              </span>
            </button>

            <button
              id="module-tri-protocol-p2p-btn"
              type="button"
              onClick={() => setActiveModule("tri-protocol-p2p")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "tri-protocol-p2p"
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-cyan-500/80 shadow-2xs"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">Tri-Protocol P2P Node</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-700 px-1.5 py-0.2 rounded font-mono font-bold">
                HTTP:3000 • TCP:6000 • UDP:7000
              </span>
            </button>

            <button
              id="module-node-intelligence-btn"
              type="button"
              onClick={() => setActiveModule("node-intelligence")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "node-intelligence"
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-cyan-400/90 shadow-2xs"
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">Node Intelligence & Block [Network]</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-700 px-1.5 py-0.2 rounded font-mono font-bold">
                PSYCH • AI • BLOCK
              </span>
            </button>

            <button
              id="module-btc-architecture-btn"
              type="button"
              onClick={() => setActiveModule("btc-architecture")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "btc-architecture"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-amber-300/90 shadow-2xs"
              }`}
            >
              <span className="font-bold text-amber-500">₿</span>
              <span className="font-semibold">Bitcoin (BTC) Node Architecture</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                RPC • ESPLORA
              </span>
            </button>

            <button
              id="module-cybersecurity-btn"
              type="button"
              onClick={() => setActiveModule("cybersecurity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "cybersecurity"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-zinc-700 hover:text-zinc-900 bg-white border border-emerald-300/80 shadow-2xs"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Cybersecurity Core</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">NIST • CIA</span>
            </button>

            <button
              id="module-vault-port-btn"
              type="button"
              onClick={() => setActiveModule("vault-port")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "vault-port"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Unified Vault Port</span>
              <span className="text-[10px] bg-zinc-500/20 text-zinc-700 px-1.5 py-0.2 rounded font-mono font-bold">MASTER</span>
            </button>

            <button
              id="module-tether-mint-btn"
              type="button"
              onClick={() => setActiveModule("tether-mint")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "tether-mint"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tether Mint Node ($100k)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.2 rounded font-mono font-bold">RADAR</span>
            </button>

            <button
              id="module-stealth-bot-btn"
              type="button"
              onClick={() => setActiveModule("stealth-bot")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "stealth-bot"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stealth Flash Loan Bot</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded font-mono font-bold">TRICK 2</span>
            </button>

            <button
              id="module-bullivant-btn"
              type="button"
              onClick={() => setActiveModule("bullivant")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "bullivant"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bullivant Distro Engine</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-600 px-1.5 py-0.2 rounded font-mono font-bold">TRICK 1</span>
            </button>

            <button
              id="module-dex-scanner-btn"
              type="button"
              onClick={() => setActiveModule("dex-scanner")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "dex-scanner"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>DEX Arbitrage Scanner</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded font-mono font-bold">LIVE</span>
            </button>
            <button
              id="module-bot-24-7-btn"
              type="button"
              onClick={() => setActiveModule("bot-24-7")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "bot-24-7"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>24/7 Bot Blueprint</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded font-mono font-bold">PM2 &amp; BullMQ</span>
            </button>
            <button
              id="module-all-btn"
              type="button"
              onClick={() => setActiveModule("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeModule === "all"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              All Modules
            </button>
            <button
              id="module-terminal-btn"
              type="button"
              onClick={() => setActiveModule("terminal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "terminal"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>CLI Scripts (14)</span>
            </button>
            <button
              id="module-gemini-btn"
              type="button"
              onClick={() => setActiveModule("gemini")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "gemini"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini API in Node.js</span>
            </button>
            <button
              id="module-node-btn"
              type="button"
              onClick={() => setActiveModule("node-core")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "node-core"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Node.js Core</span>
            </button>
            <button
              id="module-docs-btn"
              type="button"
              onClick={() => setActiveModule("docs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeModule === "docs"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>Guide &amp; Docs</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Node.js v22 • Port 3000</span>
          </div>
        </div>

        {/* Base Mainnet Flash Loan Arbitrage Dashboard (Aave V3 Zero-Loss) */}
        {(activeModule === "all" || activeModule === "base-flashloan") && (
          <section id="base-flashloan-section" className="space-y-4">
            <BaseFlashLoanDashboard />
          </section>
        )}

        {/* Next.js 14 App Router: Base Alchemy RPC & Wallet Signer Suite */}
        {(activeModule === "all" || activeModule === "nextjs-implementation") && (
          <section id="nextjs-implementation-section" className="space-y-4">
            <NextJsImplementationView />
          </section>
        )}

        {/* VPS Production Deployment Launchpad (5-Step Master Guide) */}
        {(activeModule === "all" || activeModule === "vps-launchpad") && (
          <section id="vps-launchpad-section" className="space-y-4">
            <VpsDeploymentLaunchpadView />
          </section>
        )}

        {/* Deliver The Bag Home & Arbitrage Guardrails Command Center */}
        {(activeModule === "all" || activeModule === "deliver-bag-home") && (
          <section id="deliver-bag-home-section" className="space-y-4">
            <DeliverTheBagHomeView />
          </section>
        )}

        {/* Gemini Live AI Voice Conversation Studio (gemini-3.8-live) */}
        {(activeModule === "all" || activeModule === "ai-voice") && (
          <section id="ai-voice-section" className="space-y-4">
            <GeminiLiveVoiceView />
          </section>
        )}

        {/* Mainnet Real-Money Live Transaction Console */}
        {(activeModule === "all" || activeModule === "mainnet-console") && (
          <section id="mainnet-console-section" className="space-y-4">
            <MainnetRealMoneyConsole />
          </section>
        )}

        {/* Project Port-to-URL Master Dashboard ("Every port in this project gives its URL") */}
        {(activeModule === "all" || activeModule === "ports-dashboard") && (
          <section id="ports-dashboard-section" className="space-y-4">
            <PortUrlDashboard />
          </section>
        )}

        {/* Interactive PTY Web Terminal Studio (@xterm/xterm • ws • node-pty) */}
        {(activeModule === "all" || activeModule === "terminal-pty") && (
          <section id="terminal-pty-section" className="space-y-4">
            <TerminalPtyStudio />
          </section>
        )}

        {/* Level 2 Active Runtime (AST Extraction • SSE Stream • Call Stack • Breakpoint) */}
        {(activeModule === "all" || activeModule === "level2-runtime") && (
          <section id="level2-runtime-section" className="space-y-4">
            <Level2RuntimeStudio />
          </section>
        )}

        {/* Smart Contract VM Studio (Native Node.js VM Bytecode Execution) */}
        {(activeModule === "all" || activeModule === "smart-contracts-vm") && (
          <section id="smart-contracts-vm-section" className="space-y-4">
            <SmartContractVmStudio />
          </section>
        )}

        {/* Tri-Protocol P2P Blockchain Node (HTTP • TCP • UDP) */}
        {(activeModule === "all" || activeModule === "tri-protocol-p2p") && (
          <section id="tri-protocol-p2p-section" className="space-y-4">
            <TriProtocolP2PConsole />
          </section>
        )}

        {/* Computer Node Intelligence & Block Network */}
        {(activeModule === "all" || activeModule === "node-intelligence") && (
          <section id="node-intelligence-section" className="space-y-4">
            <NodeIntelligenceBlockNetworkView />
          </section>
        )}

        {/* Bitcoin (BTC) Node.js Architecture Hub */}
        {(activeModule === "all" || activeModule === "btc-architecture") && (
          <section id="btc-architecture-section" className="space-y-4">
            <BtcArchitectureView />
          </section>
        )}

        {/* Cybersecurity Fundamentals & Best Practices */}
        {(activeModule === "all" || activeModule === "cybersecurity") && (
          <section id="cybersecurity-section" className="space-y-4">
            <CybersecurityHubView />
          </section>
        )}

        {/* Unified Smart Contract Wallet Port & Anti-Loss Investment Vault */}
        {(activeModule === "all" || activeModule === "vault-port") && (
          <section id="vault-port-section" className="space-y-4">
            <UnifiedVaultPortView />
          </section>
        )}

        {/* Tether Institutional Mint & Balance Threshold Radar */}
        {(activeModule === "all" || activeModule === "tether-mint") && (
          <section id="tether-mint-section" className="space-y-4">
            <TetherMintActivationView />
          </section>
        )}

        {/* Trick 2: Stealth Flash Loan & MEV-Resistant Bot */}
        {(activeModule === "all" || activeModule === "stealth-bot") && (
          <section id="stealth-bot-section" className="space-y-4">
            <StealthFlashLoanView />
          </section>
        )}

        {/* Trick 1: Bullivant Brand & Store Promotion Engine */}
        {(activeModule === "all" || activeModule === "bullivant") && (
          <section id="bullivant-section" className="space-y-4">
            <BullivantEngineView />
          </section>
        )}

        {/* Multi-Pool DEX Price Scanner Module (Featured Primary) */}
        {(activeModule === "all" || activeModule === "dex-scanner") && (
          <section id="dex-scanner-section" className="space-y-4">
            <DexPriceScannerDemo />
          </section>
        )}

        {/* 24/7 Multi-Chain Listeners & Bot Blueprint */}
        {(activeModule === "all" || activeModule === "bot-24-7") && (
          <section id="bot-24-7-section" className="space-y-4">
            <Bot247BlueprintView />
          </section>
        )}

        {/* Unified Interactive Script Runner */}
        {(activeModule === "all" || activeModule === "terminal") && (
          <section id="terminal-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Interactive CLI
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  Node.js Process Execution Sandbox
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">child_process.exec</span>
            </div>
            <ScriptRunnerTerminal />
          </section>
        )}

        {/* Gemini API Suite */}
        {(activeModule === "all" || activeModule === "gemini") && (
          <section id="gemini-suite-section" className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Gemini API Concepts
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  Running Node.js With Gemini API
                </span>
              </div>

              {/* Gemini subtabs */}
              <div className="flex items-center space-x-1 bg-zinc-200/60 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setGeminiSubTab("voice")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                    geminiSubTab === "voice" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                  <span>Live Voice (gemini-3.8-live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeminiSubTab("standard")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                    geminiSubTab === "standard" ? "bg-white text-zinc-900 shadow-2xs font-medium" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Standard Generation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeminiSubTab("streaming")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                    geminiSubTab === "streaming" ? "bg-white text-zinc-900 shadow-2xs font-medium" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <span>Real-time Streaming</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeminiSubTab("chat")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                    geminiSubTab === "chat" ? "bg-white text-zinc-900 shadow-2xs font-medium" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <MessageSquare className="w-3 h-3 text-blue-500" />
                  <span>Multi-Turn Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeminiSubTab("structured")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                    geminiSubTab === "structured" ? "bg-white text-zinc-900 shadow-2xs font-medium" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <FileJson className="w-3 h-3 text-amber-500" />
                  <span>JSON Schema</span>
                </button>
              </div>
            </div>

            {/* Active Gemini Feature View */}
            {geminiSubTab === "voice" && (
              <GeminiLiveVoiceView />
            )}
            {geminiSubTab === "standard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <RequestRunner apiKeyConfigured={hasApiKey} />
                </div>
                <div className="lg:col-span-5">
                  <SetupGuide />
                </div>
              </div>
            )}

            {geminiSubTab === "streaming" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <GeminiStreamDemo apiKeyConfigured={hasApiKey} />
                </div>
                <div className="lg:col-span-5">
                  <SetupGuide />
                </div>
              </div>
            )}

            {geminiSubTab === "chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <GeminiChatDemo apiKeyConfigured={hasApiKey} />
                </div>
                <div className="lg:col-span-5">
                  <SetupGuide />
                </div>
              </div>
            )}

            {geminiSubTab === "structured" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <GeminiStructuredDemo apiKeyConfigured={hasApiKey} />
                </div>
                <div className="lg:col-span-5">
                  <SetupGuide />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Node.js Core Fundamentals */}
        {(activeModule === "all" || activeModule === "node-core") && (
          <section id="node-core-section" className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Node.js Core
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  Asynchronous Filesystem (<code>fs.readFile</code>), OS, Express &amp; Built-in HTTP
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Event Loop &amp; I/O</span>
            </div>

            {/* Variables and Functions Demo */}
            <VariablesFunctionsDemo />

            {/* Objects, Arrays & Destructuring Demo */}
            <ObjectsArraysDemo />

            {/* Asynchronous JavaScript Demo (Callbacks, Promises, Async/Await) */}
            <AsyncJsDemo />

            {/* Key JavaScript Concepts Reference Card */}
            <JsConceptsSummaryCard />

            {/* Asynchronous File System Demo */}
            <AsyncFsDemo />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CliExpressDemo />
              <HttpServerDemo server8080Active={status?.httpServer8080Running ?? true} />
            </div>
          </section>
        )}

        {/* Documentation & Setup Guide Full View */}
        {(activeModule === "docs") && (
          <section id="docs-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  Reference
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  Full Codebase &amp; Architecture Documentation
                </span>
              </div>
            </div>
            <SetupGuide />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="border-t border-zinc-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Running Node.js With Gemini API • CLI (<code>os.platform()</code>), Streaming, Multi-Turn Chat, JSON Schema &amp; Express
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            Node.js v22 • @google/genai v2.4.0
          </div>
        </div>
      </footer>
      {/* Port 1: Refill Front Port Modal */}
      <RefillFrontPortModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        gasBalance={gasBalance}
        signerAddress={signerAddress}
        onRefillSuccess={(newBalance, _msg) => {
          setGasBalance(newBalance);
          fetchAutomation();
        }}
        automationState={automationState}
        onToggleAutomation={handleToggleAutomation}
        onNavigateToScanner={() => setActiveModule("dex-scanner")}
      />
    </div>
  );
}
