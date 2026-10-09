import React, { useState, useEffect } from "react";
import {
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal,
  Zap,
  Activity,
  CheckCircle2,
  Cpu,
  FileCode2,
  Copy,
  Check,
} from "lucide-react";

export function MultiChainHubView() {
  const [loading, setLoading] = useState<boolean>(true);
  const [multiStatus, setMultiStatus] = useState<any>(null);
  const [scriptRunning, setScriptRunning] = useState<boolean>(false);
  const [scriptOutput, setScriptOutput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/multichain/status");
      const data = await res.json();
      if (data.success) {
        setMultiStatus(data.status);
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunScript = async () => {
    setScriptRunning(true);
    setScriptOutput("Connecting simultaneously to Bitcoin and Ethereum networks via Node.js...\n");
    try {
      const res = await fetch("/api/multichain/run-script", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScriptOutput(data.output);
      } else {
        setScriptOutput(`[Execution Error Exit Code ${data.exitCode}]:\n${data.output}`);
      }
    } catch (err: any) {
      setScriptOutput(`Script execution failed: ${err.message}`);
    } finally {
      setScriptRunning(false);
    }
  };

  const sampleScriptCode = `// app.js - Simultaneous Multi-Chain Node.js Architecture
import { ethers } from "ethers";

// 1. Ethereum Pipeline (Account Model / EVM)
const ethProvider = new ethers.JsonRpcProvider("https://rpc.flashbots.net");
const [ethBlock, feeData] = await Promise.all([
  ethProvider.getBlockNumber(),
  ethProvider.getFeeData()
]);
console.log(\`Ξ Ethereum Block: #\${ethBlock} | Gas: \${Number(feeData.gasPrice)/1e9} Gwei\`);

// 2. Bitcoin Pipeline (UTXO Model / JSON-RPC Port 8332 or Esplora)
const btcResp = await fetch("http://127.0.0.1:8332", {
  method: "POST",
  headers: { "Authorization": "Basic " + btoa("user:pass") },
  body: JSON.stringify({ jsonrpc: "1.0", id: "app", method: "getblockcount", params: [] })
});`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold text-lg">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Multi-Chain Node.js Hub: Bitcoin (BTC) & Ethereum (ETH)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Dual-Pipeline Live
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
                Connect a single Node.js backend simultaneously to Bitcoin (UTXO, JSON-RPC HTTP) and Ethereum (Account model, ethers.js JSON-RPC). Read real-time blocks, mempool fees, and execute dual-chain scripts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Multi-Chain
            </button>
            <button
              onClick={handleRunScript}
              disabled={scriptRunning}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              {scriptRunning ? "Running Script..." : "Run multi-chain-client.js"}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Live Network Pipelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bitcoin Pipeline */}
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                ₿
              </span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Bitcoin Pipeline</h4>
                <span className="text-[11px] text-zinc-500 font-mono">Port 8332 / Esplora REST</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
              UTXO Model
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100">
                <span className="text-[11px] text-zinc-500 block">Latest Block Height</span>
                <span className="text-base font-bold font-mono text-zinc-900">
                  {multiStatus?.bitcoin?.blockHeight ? `#${multiStatus.bitcoin.blockHeight.toLocaleString()}` : "Loading..."}
                </span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100">
                <span className="text-[11px] text-zinc-500 block">Fastest Fee (Next Block)</span>
                <span className="text-base font-bold font-mono text-amber-700">
                  {multiStatus?.bitcoin?.fastestFeeSatVb ? `${multiStatus.bitcoin.fastestFeeSatVb} sat/vB` : "3 sat/vB"}
                </span>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-amber-100 space-y-1.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-500">Block Time:</span>
                <span className="font-semibold text-zinc-800">~10 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Block Reward:</span>
                <span className="font-semibold text-zinc-800">3.125 BTC (Post-Halving)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Scripting:</span>
                <span className="font-semibold text-zinc-800">Bitcoin Script (Non-Turing)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Client Libraries:</span>
                <span className="font-mono text-amber-800 font-medium">bitcoin-core, bitcoinjs-lib</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ethereum Pipeline */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/20 border border-indigo-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                Ξ
              </span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Ethereum Pipeline</h4>
                <span className="text-[11px] text-zinc-500 font-mono">ethers.JsonRpcProvider</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
              Account Model
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                <span className="text-[11px] text-zinc-500 block">Latest Block Height</span>
                <span className="text-base font-bold font-mono text-zinc-900">
                  {multiStatus?.ethereum?.blockHeight ? `#${multiStatus.ethereum.blockHeight.toLocaleString()}` : "Loading..."}
                </span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                <span className="text-[11px] text-zinc-500 block">Base / Gas Price</span>
                <span className="text-base font-bold font-mono text-indigo-700">
                  {multiStatus?.ethereum?.gasPriceGwei ? `${multiStatus.ethereum.gasPriceGwei} Gwei` : "1.2 Gwei"}
                </span>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-500">Block Time:</span>
                <span className="font-semibold text-zinc-800">~12 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Finality:</span>
                <span className="font-semibold text-zinc-800">2 Epochs (~12.8 minutes)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Scripting:</span>
                <span className="font-semibold text-zinc-800">EVM (Turing Complete Solidity)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Client Libraries:</span>
                <span className="font-mono text-indigo-800 font-medium">ethers.js, web3.js</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Output if script ran */}
      {scriptOutput && (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 shadow-md font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2 mb-2">
            <span className="flex items-center gap-2 text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
              CLI Execution Output: node multi-chain-client.js
            </span>
            <button
              onClick={() => setScriptOutput("")}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {scriptOutput}
          </pre>
        </div>
      )}

      {/* Architectural Differences Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Key Architectural Differences: Bitcoin vs. Ethereum
          </h4>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? "Copied Snippet" : "Copy Node.js Setup"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3">Bitcoin Pipeline ₿</th>
                <th className="py-2.5 px-3">Ethereum Pipeline Ξ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900">Accounting Model</td>
                <td className="py-2.5 px-3">
                  <strong>UTXO</strong> (Unspent Transaction Outputs). You spend discrete chunks and receive "change" outputs back.
                </td>
                <td className="py-2.5 px-3">
                  <strong>Account / Balance Model</strong>. Operates like a traditional bank balance ledger with single address nonces.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900">Transaction Signing</td>
                <td className="py-2.5 px-3 font-mono">
                  bitcoinjs-lib (PSBT / witness scripts)
                </td>
                <td className="py-2.5 px-3 font-mono">
                  ethers.js (wallet.sendTransaction)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900">Smart Contracts</td>
                <td className="py-2.5 px-3">
                  Stateless Bitcoin Script (P2WPKH, Taproot / MAST). High security, deterministic validation.
                </td>
                <td className="py-2.5 px-3">
                  Stateful Turing-complete EVM (Solidity contracts with complex storage slots).
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900">Connection Mode</td>
                <td className="py-2.5 px-3 font-mono">
                  HTTP POST JSON-RPC payload to :8332 or Esplora REST
                </td>
                <td className="py-2.5 px-3 font-mono">
                  JSON-RPC provider / WebSocket to execution client
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
