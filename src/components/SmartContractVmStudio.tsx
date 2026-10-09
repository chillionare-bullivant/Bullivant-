import React, { useState, useEffect } from "react";
import {
  Code2,
  Cpu,
  ShieldCheck,
  Zap,
  Play,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Lock,
  Flame,
  Plus,
  Send,
  Sliders,
  FileCode,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface SmartContract {
  address: string;
  code: string;
  state: any;
  creator: string;
  blockDeployed: number;
  deployedAt: string;
  eventsCount: number;
  events: Array<{ event: string; data: any; timestamp: number }>;
}

interface ExecutionLog {
  type: "DEPLOY_CONTRACT" | "CALL_CONTRACT";
  address: string;
  method?: string;
  caller?: string;
  args?: any;
  result?: any;
  success: boolean;
  error?: string;
  executionTimeUs: number;
  stateRoot: string;
  events?: any[];
}

export function SmartContractVmStudio() {
  const [activeTab, setActiveTab] = useState<"interact" | "deploy" | "security" | "ledger">("interact");
  const [loading, setLoading] = useState<boolean>(true);
  const [stateRoot, setStateRoot] = useState<string>("");
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [templates, setTemplates] = useState<any>({});
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Method invocation state
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [methodArgsJson, setMethodArgsJson] = useState<string>("{}");
  const [callerAddress, setCallerAddress] = useState<string>("0xAliceDeployer");
  const [attachedValue, setAttachedValue] = useState<number>(0);
  const [callingMethod, setCallingMethod] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<any>(null);

  // Contract deployment state
  const [deployTemplate, setDeployTemplate] = useState<string>("ERC20_TOKEN");
  const [deployCode, setDeployCode] = useState<string>("");
  const [deployInitialState, setDeployInitialState] = useState<string>("{}");
  const [deployCreator, setDeployCreator] = useState<string>("0xAliceDeployer");
  const [deployTimeoutMs, setDeployTimeoutMs] = useState<number>(150);
  const [deploying, setDeploying] = useState<boolean>(false);
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  // Security lab state
  const [attackTesting, setAttackTesting] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<any>(null);

  // CLI runner state
  const [cliRunning, setCliRunning] = useState<boolean>(false);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [copiedRoot, setCopiedRoot] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vm/overview").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setStateRoot(data.stateRoot || "");
          setBlockHeight(data.blockHeight || 0);
          setContracts(data.contracts || []);
          setLogs(data.logs || []);
          setTemplates(data.templates || {});

          if (!selectedAddress && data.contracts?.length > 0) {
            setSelectedAddress(data.contracts[0].address);
          }
        }
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Update deploy form when template changes
  useEffect(() => {
    if (templates[deployTemplate]) {
      setDeployCode(templates[deployTemplate].code);
      setDeployInitialState(JSON.stringify(templates[deployTemplate].initialState, null, 2));
    }
  }, [deployTemplate, templates]);

  const selectedContract = contracts.find((c) => c.address === selectedAddress) || contracts[0];

  // Set default method when selected contract changes
  useEffect(() => {
    if (selectedContract) {
      if (selectedContract.code.includes("function transfer")) {
        setSelectedMethod("transfer");
        setMethodArgsJson(JSON.stringify({ to: "0xBobTrader", amount: 15000 }, null, 2));
      } else if (selectedContract.code.includes("function swap")) {
        setSelectedMethod("swap");
        setMethodArgsJson(JSON.stringify({ amountIn: 1000, isAForB: true }, null, 2));
      } else if (selectedContract.code.includes("function createEscrow")) {
        setSelectedMethod("createEscrow");
        setMethodArgsJson(JSON.stringify({ seller: "0xMerchantCarol", amount: 500, lockDurationSeconds: 3600 }, null, 2));
      } else {
        setSelectedMethod("");
        setMethodArgsJson("{}");
      }
    }
  }, [selectedContract?.address]);

  const handleCallMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !selectedMethod) return;

    setCallingMethod(true);
    setCallResult(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(methodArgsJson);
      } catch (_pErr) {
        setCallResult({ success: false, error: "Invalid JSON in Arguments" });
        setCallingMethod(false);
        return;
      }

      const res = await fetch("/api/vm/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedContract.address,
          method: selectedMethod,
          args: parsedArgs,
          caller: callerAddress,
          value: attachedValue,
          timeoutMs: 150,
        }),
      });

      const json = await res.json();
      setCallResult(json);
      if (json.overview) {
        setStateRoot(json.overview.stateRoot);
        setContracts(json.overview.contracts);
        setLogs(json.overview.logs);
      }
    } catch (err: any) {
      setCallResult({ success: false, error: err.message });
    } finally {
      setCallingMethod(false);
    }
  };

  const handleDeployContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setDeployFeedback(null);
    try {
      let parsedState = {};
      try {
        parsedState = JSON.parse(deployInitialState);
      } catch (_pErr) {
        setDeployFeedback("Error: Initial State must be valid JSON");
        setDeploying(false);
        return;
      }

      const res = await fetch("/api/vm/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: deployCode,
          initialState: parsedState,
          creator: deployCreator,
          timeoutMs: deployTimeoutMs,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDeployFeedback(`✓ Contract deployed at ${json.address} in ${json.executionTimeUs} μs!`);
        if (json.overview) {
          setStateRoot(json.overview.stateRoot);
          setContracts(json.overview.contracts);
          setLogs(json.overview.logs);
          setSelectedAddress(json.address);
          setActiveTab("interact");
        }
      } else {
        setDeployFeedback(`Deployment Failed: ${json.error}`);
      }
    } catch (err: any) {
      setDeployFeedback(`Network Error: ${err.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleRunSecurityAttack = async (attackType: "infinite-loop" | "host-escape" | "timer-leak") => {
    setAttackTesting(true);
    setAttackResult(null);
    try {
      const res = await fetch("/api/vm/test-attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackType }),
      });
      const json = await res.json();
      setAttackResult(json);
      await fetchOverview();
    } catch (err: any) {
      setAttackResult({ success: false, error: err.message });
    } finally {
      setAttackTesting(false);
    }
  };

  const handleRunCli = async () => {
    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: "smart-contract-vm-engine.cjs", args: "" }),
      });
      const json = await res.json();
      setCliOutput(json.stdout || json.stderr || "Executed cleanly.");
      await fetchOverview();
    } catch (err: any) {
      setCliOutput("Execution completed with error: " + err.message);
    } finally {
      setCliRunning(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset the smart contract VM state database to default contracts?")) return;
    try {
      const res = await fetch("/api/vm/reset", { method: "POST" });
      const json = await res.json();
      setStateRoot(json.stateRoot);
      setContracts(json.contracts);
      setLogs(json.logs);
      if (json.contracts?.length > 0) {
        setSelectedAddress(json.contracts[0].address);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyStateRoot = () => {
    if (stateRoot) {
      navigator.clipboard.writeText(stateRoot);
      setCopiedRoot(true);
      setTimeout(() => setCopiedRoot(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Native Node.js 'vm' Engine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sandboxed Bytecode Execution
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                CPU Limit: 150ms Gas Cap
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-100">
              Smart Contract VM Studio
            </h1>
            <p className="text-xs lg:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Execute Turing-complete smart contracts inside blockchain blocks using Node.js's native{" "}
              <code className="text-purple-300 font-mono bg-purple-950/60 px-1 py-0.5 rounded">vm.createContext</code>.
              Hardened with CPU timeouts against the halting problem, isolated from host OS APIs, and verified with deterministic SHA-256 state roots.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col items-end gap-2.5">
            <button
              onClick={handleRunCli}
              disabled={cliRunning}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {cliRunning ? "Running Node.js CLI..." : "Run 'node smart-contract-vm-engine.cjs'"}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchOverview}
                disabled={loading}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 text-xs font-semibold rounded-xl transition"
              >
                Reset State
              </button>
            </div>
          </div>
        </div>

        {/* State Root & Metrics Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* State Root */}
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-purple-400" />
                Global State Root Digest
              </span>
              <button
                onClick={copyStateRoot}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
              >
                <Copy className="w-3 h-3" />
                {copiedRoot ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="font-mono text-xs text-purple-300 font-bold truncate">
              {stateRoot || "Calculating..."}
            </div>
            <div className="text-[10px] text-zinc-500">
              SHA-256 Merkle-style root over all contract balances & storage
            </div>
          </div>

          {/* Active Contracts */}
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-emerald-400" />
                Deployed Contracts
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {contracts.length} LIVE
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              Block Height: <span className="text-emerald-400 font-bold">#{blockHeight}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              ERC-20 Fungible Tokens, AMM Liquidity Pools, Escrow Vaults
            </div>
          </div>

          {/* Gas & Sandbox Isolation */}
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-amber-400" />
                Execution Isolation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                HARDENED
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200">
              Host APIs (fs, process, timers): <span className="text-red-400 font-bold">NULLIFIED</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Deterministic sandbox passes pure state & events
            </div>
          </div>
        </div>
      </div>

      {/* CLI Script Execution Drawer (Collapsible) */}
      {cliOutput && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-300">
                CLI Output: <code className="text-purple-300 font-mono">node smart-contract-vm-engine.cjs</code>
              </span>
            </div>
            <button
              onClick={() => setCliOutput(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Close Drawer
            </button>
          </div>
          <pre className="p-4 bg-zinc-900 rounded-xl overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-80 whitespace-pre-wrap">
            {cliOutput}
          </pre>
        </div>
      )}

      {/* 2. Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab("interact")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "interact"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Contract Explorer & Caller
        </button>
        <button
          onClick={() => setActiveTab("deploy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "deploy"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Deploy New Contract
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "security"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security & Halting Defense Lab
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "ledger"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Execution Log & State Root History
        </button>
      </div>

      {/* TAB 1: Contract Explorer & Caller */}
      {activeTab === "interact" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Contract Selector & Invocation Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  Target Smart Contract
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                  Select deployed instance
                </span>
              </div>

              {/* Contract Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Contract Address</label>
                <select
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50 focus:bg-white"
                >
                  {contracts.map((c) => {
                    const isErc20 = c.code.includes("balanceOf");
                    const isAmm = c.code.includes("swap");
                    const isEscrow = c.code.includes("createEscrow");
                    const label = isErc20
                      ? `ERC-20 Token (${c.state?.symbol || "VTX"}) - ${c.address.slice(0, 10)}...`
                      : isAmm
                      ? `Constant Product AMM Pool - ${c.address.slice(0, 10)}...`
                      : isEscrow
                      ? `Timelock Escrow Vault - ${c.address.slice(0, 10)}...`
                      : `Custom Contract - ${c.address.slice(0, 10)}...`;

                    return (
                      <option key={c.address} value={c.address}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quick Method Buttons */}
              {selectedContract && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-semibold text-zinc-600">Quick Method Presets:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContract.code.includes("function transfer") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("transfer");
                            setMethodArgsJson(JSON.stringify({ to: "0xBobTrader", amount: 15000 }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          transfer()
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("mint");
                            setMethodArgsJson(JSON.stringify({ to: "0xBobTrader", amount: 50000 }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          mint()
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("balanceOf");
                            setMethodArgsJson(JSON.stringify({ account: "0xBobTrader" }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          balanceOf()
                        </button>
                      </>
                    )}

                    {selectedContract.code.includes("function swap") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("swap");
                            setMethodArgsJson(JSON.stringify({ amountIn: 1000, isAForB: true }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          swap(USDT ➔ ETH)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("swap");
                            setMethodArgsJson(JSON.stringify({ amountIn: 0.5, isAForB: false }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          swap(ETH ➔ USDT)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("getQuote");
                            setMethodArgsJson(JSON.stringify({ amountIn: 1000, isAForB: true }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          getQuote()
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("addLiquidity");
                            setMethodArgsJson(JSON.stringify({ amountA: 2000, amountB: 1 }, null, 2));
                          }}
                          className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-mono font-medium transition"
                        >
                          addLiquidity()
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Execution Form */}
              <form onSubmit={handleCallMethod} className="space-y-3 pt-2 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Method Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. transfer"
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Caller (msg.sender)
                    </label>
                    <input
                      type="text"
                      value={callerAddress}
                      onChange={(e) => setCallerAddress(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Method Arguments (JSON format)
                  </label>
                  <textarea
                    rows={3}
                    value={methodArgsJson}
                    onChange={(e) => setMethodArgsJson(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={callingMethod || !selectedMethod}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                  {callingMethod ? "Executing in VM Sandbox..." : `Execute ${selectedMethod || "Method"} in VM`}
                </button>
              </form>

              {/* Execution Result Feedback */}
              {callResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    callResult.success
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-red-50/70 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{callResult.success ? "Execution Succeeded ✓" : "Execution Reverted ✗"}</span>
                    {callResult.executionTimeUs != null && (
                      <span className="font-mono text-[10px]">
                        {callResult.executionTimeUs} μs (~{((callResult.executionTimeUs ?? 0) / 1000).toFixed(2)} ms)
                      </span>
                    )}
                  </div>
                  {callResult.returnValue !== undefined && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Return Value:
                      </div>
                      <pre className="p-1.5 bg-white rounded border border-emerald-200 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(callResult.returnValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {callResult.error && (
                    <div className="font-mono text-[11px] font-semibold text-red-700">
                      {callResult.error}
                    </div>
                  )}
                  {callResult.stateRoot && (
                    <div className="text-[10px] font-mono text-zinc-600">
                      New State Root: <span className="font-bold text-zinc-900">{callResult.stateRoot.slice(0, 24)}...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Contract State & Code Viewer */}
          <div className="lg:col-span-6 space-y-6">
            {selectedContract ? (
              <>
                {/* Live Storage State */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-600" />
                      Persistent Contract State
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                      Block #{selectedContract.blockDeployed}
                    </span>
                  </div>
                  <pre className="p-3 bg-zinc-950 text-emerald-400 rounded-xl font-mono text-xs max-h-64 overflow-y-auto">
                    {JSON.stringify(selectedContract.state, null, 2)}
                  </pre>
                </div>

                {/* Contract Bytecode / JavaScript */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-600" />
                      Contract Script Source
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Creator: {selectedContract.creator}
                    </span>
                  </div>
                  <pre className="p-3 bg-zinc-900 text-zinc-300 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap">
                    {selectedContract.code}
                  </pre>
                </div>

                {/* Emitted Events */}
                {selectedContract.events && selectedContract.events.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-600" />
                      Emitted Receipt Events ({selectedContract.events.length})
                    </h3>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {selectedContract.events.slice().reverse().map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-mono flex items-center justify-between"
                        >
                          <span className="font-bold text-amber-900">{ev.event}</span>
                          <span className="text-zinc-500 text-[10px] truncate max-w-[240px]">
                            {JSON.stringify(ev.data)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500">
                No smart contracts deployed yet. Click "Deploy New Contract" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Deploy New Contract */}
      {activeTab === "deploy" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                Deploy Smart Contract into Blockchain Block
              </h3>
              <p className="text-xs text-zinc-500">
                Compile and execute the contract's initialization script inside the isolated VM sandbox.
              </p>
            </div>
            {templates && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600">Template:</span>
                <select
                  value={deployTemplate}
                  onChange={(e) => setDeployTemplate(e.target.value)}
                  className="p-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-zinc-50"
                >
                  <option value="ERC20_TOKEN">ERC-20 Fungible Token</option>
                  <option value="AMM_DEX_POOL">Constant Product AMM (Uniswap v2)</option>
                  <option value="TIMELOCK_ESCROW">Timelock Escrow Vault</option>
                  <option value="MALICIOUS_LOOP_ATTACK">Malicious Loop (Security Demo)</option>
                </select>
              </div>
            )}
          </div>

          <form onSubmit={handleDeployContract} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Deployer Address (msg.sender)</label>
                <input
                  type="text"
                  value={deployCreator}
                  onChange={(e) => setDeployCreator(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Gas Timeout Limit (ms)</label>
                <input
                  type="number"
                  value={deployTimeoutMs}
                  onChange={(e) => setDeployTimeoutMs(Number(e.target.value))}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Target Block</label>
                <input
                  type="text"
                  disabled
                  value={`Next Mined Block #${blockHeight + 1}`}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-xs font-mono bg-zinc-100 text-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Initial Storage State (JSON)</label>
              <textarea
                rows={4}
                value={deployInitialState}
                onChange={(e) => setDeployInitialState(e.target.value)}
                className="w-full p-3 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Contract Script Code (JavaScript inside VM)
              </label>
              <textarea
                rows={12}
                value={deployCode}
                onChange={(e) => setDeployCode(e.target.value)}
                className="w-full p-3 border border-zinc-300 rounded-xl text-xs font-mono bg-zinc-900 text-zinc-200 focus:bg-zinc-950"
                required
              />
            </div>

            <button
              type="submit"
              disabled={deploying}
              className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {deploying ? "Deploying & Sandboxing..." : "Deploy Contract to Blockchain Block"}
            </button>
          </form>

          {deployFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium ${
                deployFeedback.startsWith("✓")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {deployFeedback}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security & Halting Defense Lab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Sandboxed Adversarial Testing Lab
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                Halting Problem & Escape Protection
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-3xl leading-relaxed">
              In a decentralized blockchain, any malicious user can submit contracts designed to freeze peer nodes.
              Using Node.js native <span className="font-mono text-purple-700">vm</span>, we enforce strict
              deterministic CPU gas limits and isolate all Node.js host privileges (preventing filesystem, network, and timer leaks).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Attack 1 */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-zinc-900">1. Halting Problem Loop</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Executes <span className="font-mono">while(true)</span> to freeze the CPU. Node.js <span className="font-mono">vm timeout (50ms)</span> traps and kills it instantly.
                </p>
                <button
                  type="button"
                  onClick={() => handleRunSecurityAttack("infinite-loop")}
                  disabled={attackTesting}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Test Infinite Loop Attack
                </button>
              </div>

              {/* Attack 2 */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-900">2. Host Escape (FS/Process)</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Attempts <span className="font-mono">process.require('fs')</span> to steal server files. Global variables are stripped to null in sandbox.
                </p>
                <button
                  type="button"
                  onClick={() => handleRunSecurityAttack("host-escape")}
                  disabled={attackTesting}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Test Host Escape Attack
                </button>
              </div>

              {/* Attack 3 */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-zinc-900">3. Async Timer Leak</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Attempts <span className="font-mono">setTimeout</span> to execute outside block lifecycle. Timers are blocked to enforce synchronous finality.
                </p>
                <button
                  type="button"
                  onClick={() => handleRunSecurityAttack("timer-leak")}
                  disabled={attackTesting}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Test Timer Leak Attack
                </button>
              </div>
            </div>

            {/* Attack Results Console */}
            {attackResult && (
              <div className="mt-4 p-4 bg-zinc-950 text-white rounded-xl border border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Attack Result: {attackResult.phase}</span>
                  <span>Defense Status: {attackResult.defenseTriggered ? "TRAPPED (PASS) ✓" : "FAIL"}</span>
                </div>
                <div className="text-zinc-300">
                  {attackResult.explanation}
                </div>
                {attackResult.error && (
                  <div className="p-2 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-[11px]">
                    Captured Sandbox Error: {attackResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Execution Log & State Root History */}
      {activeTab === "ledger" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Contract Execution Receipts & State Root History
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              {logs.length} Recorded Transactions
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                No execution logs recorded yet. Execute contract methods to build history.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1.5 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === "DEPLOY_CONTRACT"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-cyan-100 text-cyan-800"
                        }`}
                      >
                        {log.type}
                      </span>
                      {log.method && <span className="font-bold text-zinc-900">{log.method}()</span>}
                      <span className="text-zinc-500 text-[10px]">{log.address.slice(0, 14)}...</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {log.executionTimeUs} μs
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                    <span>Caller: {log.caller || "Deployer"}</span>
                    <span>State Root: {log.stateRoot?.slice(0, 20)}...</span>
                  </div>

                  {log.args && Object.keys(log.args).length > 0 && (
                    <div className="text-[10px] text-zinc-600 bg-white p-1.5 rounded border border-zinc-200 truncate">
                      Args: {JSON.stringify(log.args)}
                    </div>
                  )}

                  {log.error && (
                    <div className="text-[10px] text-red-600 font-semibold">
                      Error: {log.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
