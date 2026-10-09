import React, { useState } from "react";
import {
  Terminal,
  Server,
  Radio,
  Play,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface EvmRpcBridgeConsoleProps {
  onOpenPort7777Modal?: () => void;
  defaultRpcUrl?: string;
  defaultWsUrl?: string;
  defaultBridgeUrl?: string;
}

export function EvmRpcBridgeConsole({
  onOpenPort7777Modal,
  defaultRpcUrl = "http://127.0.0.1:8545",
  defaultWsUrl = "ws://127.0.0.1:8546",
  defaultBridgeUrl = "http://127.0.0.1:7777",
}: EvmRpcBridgeConsoleProps) {
  const [rpcUrl, setRpcUrl] = useState<string>(defaultRpcUrl);
  const [wsUrl, setWsUrl] = useState<string>(defaultWsUrl);
  const [bridgeUrl, setBridgeUrl] = useState<string>(defaultBridgeUrl);
  const [ipAddress, setIpAddress] = useState<string>("192.168.1.100");
  const [activeSnippetTab, setActiveSnippetTab] = useState<
    "curl" | "wscat" | "ethers" | "python" | "ufw" | "tailscale"
  >("curl");

  const [testingRpc, setTestingRpc] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Combined Tri-Port Convergence State
  const [combining, setCombining] = useState<boolean>(false);
  const [combinedResult, setCombinedResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestRpc = async () => {
    setTestingRpc(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/rpc/test-evm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpcUrl }),
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        setTestResult(data);
      } else {
        setTestResult({ success: false, error: "Failed to contact RPC endpoint" });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to contact RPC endpoint",
      });
    } finally {
      setTestingRpc(false);
    }
  };

  const handleExecuteCombined = async () => {
    setCombining(true);
    setCombinedResult(null);
    try {
      const res = await fetch("/api/combined/evm-reality-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rpcUrl,
          wsUrl,
          bridgeUrl,
          executeSweep: true,
        }),
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        setCombinedResult(data);
      } else {
        setCombinedResult({ success: false, error: "Convergence execution failed" });
      }
    } catch (err: any) {
      setCombinedResult({
        success: false,
        error: err.message || "Convergence execution failed",
      });
    } finally {
      setCombining(false);
    }
  };

  const curlSnippet = `curl -X POST -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \\
  ${rpcUrl || "YOUR_RPC_URL_HERE"}`;

  const wscatSnippet = `# Install wscat if not already available
npm install -g wscat

# Connect to the WebSocket RPC
wscat -c ${wsUrl || "wss://YOUR_WS_RPC_URL_HERE"}

# Subscribe to real-time new block headers:
{"jsonrpc": "2.0", "method": "eth_subscribe", "params": ["newHeads"], "id": 1}`;

  const ethersSnippet = `const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("${rpcUrl || "YOUR_RPC_URL_HERE"}");

async function checkBlock() {
    const blockNumber = await provider.getBlockNumber();
    console.log("Current Block:", blockNumber);
}
checkBlock();`;

  const pythonSnippet = `from web3 import Web3

rpc_url = "${rpcUrl || "YOUR_RPC_URL_HERE"}"
web3 = Web3(Web3.HTTPProvider(rpc_url))

print("Connected:", web3.is_connected())
print("Latest Block:", web3.eth.block_number)`;

  const ufwSnippet = `# Allow local or specific IP access only (Recommended for security)
sudo ufw allow from ${ipAddress || "YOUR_IP_ADDRESS"} to any port 8545`;

  const tailscaleSnippet = `# 1. Install Tailscale on your physical hardware (Raspberry Pi, PC, or Server)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Get your hardware's 100.x.y.z Tailscale IP
tailscale ip -4

# 3. Allow Bitcoin RPC over Tailscale interface in your bitcoin.conf
server=1
rpcbind=100.64.12.89
rpcallowip=100.0.0.0/8
rpcport=8332
rpcuser=bitcoinrpc

# Alternative: Expose Bitcoin RPC port 8332 securely via authenticated tunnel
ngrok tcp 833200`;

  const getActiveCode = () => {
    switch (activeSnippetTab) {
      case "curl":
        return curlSnippet;
      case "wscat":
        return wscatSnippet;
      case "ethers":
        return ethersSnippet;
      case "python":
        return pythonSnippet;
      case "ufw":
        return ufwSnippet;
      case "tailscale":
        return tailscaleSnippet;
      default:
        return curlSnippet;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white shadow-xl space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white tracking-tight">
                EVM RPC &amp; Port 8545 / 7777 Live Bridge Console
              </h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                REALITY LINK
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Connect external RPC nodes, test <code className="text-cyan-400">eth_blockNumber</code>, stream headers, and secure local ports.
            </p>
          </div>
        </div>

        {onOpenPort7777Modal && (
          <button
            type="button"
            onClick={onOpenPort7777Modal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Port 7777 Cold Address Bridge</span>
          </button>
        )}
      </div>

      {/* Tri-Port Convergence Hub Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-cyan-400 font-bold block text-[11px] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              EVM JSON-RPC (Port 8545)
            </label>
            <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
              HTTP POST
            </span>
          </div>
          <input
            type="text"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            placeholder="http://127.0.0.1:8545"
            className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs font-mono focus:outline-cyan-500"
          />
          <div className="text-[10px] text-zinc-400">
            Methods: <code className="text-zinc-300">eth_blockNumber</code>, <code className="text-zinc-300">eth_chainId</code>
          </div>
        </div>

        <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-purple-400 font-bold block text-[11px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              EVM WebSocket (Port 8546)
            </label>
            <span className="text-[10px] px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded font-mono">
              RFC 6455
            </span>
          </div>
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="ws://127.0.0.1:8546"
            className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs font-mono focus:outline-purple-500"
          />
          <div className="text-[10px] text-zinc-400">
            Subscription: <code className="text-zinc-300">newHeads</code> block stream
          </div>
        </div>

        <div className="space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-emerald-400 font-bold block text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Reality Bridge (Port 7777)
            </label>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono">
              COLD LINK
            </span>
          </div>
          <input
            type="text"
            value={bridgeUrl}
            onChange={(e) => setBridgeUrl(e.target.value)}
            placeholder="http://127.0.0.1:7777"
            className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs font-mono focus:outline-emerald-500"
          />
          <div className="text-[10px] text-zinc-400">
            Target: <code className="text-zinc-300">Automated Cold Sweep</code>
          </div>
        </div>
      </div>

      {/* Main Action Bar: Combine Interaction to Finalize */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-cyan-950/70 via-purple-950/60 to-emerald-950/70 border border-cyan-800/60 rounded-xl shadow-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="font-bold text-white text-xs">
              Tri-Port Pipeline: 8545 (RPC) + 8546 (WS) + 7777 (Bridge)
            </h4>
          </div>
          <p className="text-[11px] text-zinc-300 font-sans">
            Queries EVM block height, confirms WebSocket streaming, sweeps arbitrage profits to Cold Storage, and mines cryptographic Proof-of-Intelligence receipt.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTestRpc}
            disabled={testingRpc || combining}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-zinc-700 disabled:opacity-50"
          >
            {testingRpc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Test 8545</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteCombined}
            disabled={combining}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {combining ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-black" />
            )}
            <span>{combining ? "Converging Pipeline..." : "Combine & Execute Interaction"}</span>
          </button>
        </div>
      </div>

      {/* Combined Convergence Result Display */}
      {combinedResult && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-3 ${
            combinedResult.success
              ? "bg-zinc-900/90 border-cyan-600/80 text-zinc-100 shadow-xl"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
            <span className="font-bold flex items-center space-x-2 text-sm">
              {combinedResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-white">
                {combinedResult.success
                  ? "Tri-Port Convergence Complete: Ports 8545, 8546 & 7777 Synchronized"
                  : "Tri-Port Execution Failed"}
              </span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Execution Time: {combinedResult.totalLatencyMs}ms | Network: {combinedResult.realityBridge?.networkName || "Base L2"}
            </span>
          </div>

          {combinedResult.success && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Port 8545 */}
              <div className="bg-black/60 p-3 rounded-lg border border-cyan-900/50 space-y-1">
                <div className="text-[11px] font-bold text-cyan-400 flex items-center justify-between">
                  <span>EVM JSON-RPC (8545)</span>
                  <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 rounded font-mono">LIVE</span>
                </div>
                <div className="text-white font-mono text-xs">
                  Block: #{combinedResult.evmRpc?.blockNumber?.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Chain ID: <code className="text-zinc-200">{combinedResult.evmRpc?.chainId}</code> (Base L2)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Gas: <code className="text-zinc-200">{combinedResult.evmRpc?.gasPrice}</code> | Balance: <code className="text-emerald-400">{combinedResult.evmRpc?.balance}</code>
                </div>
              </div>

              {/* Card 2: Port 8546 */}
              <div className="bg-black/60 p-3 rounded-lg border border-purple-900/50 space-y-1">
                <div className="text-[11px] font-bold text-purple-400 flex items-center justify-between">
                  <span>EVM WebSocket (8546)</span>
                  <span className="text-[9px] px-1 bg-purple-950 text-purple-300 rounded font-mono">STREAMING</span>
                </div>
                <div className="text-white font-mono text-xs">
                  Sub: {combinedResult.evmWs?.subscriptionType}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Synced Head: #{combinedResult.evmWs?.subscribedBlock?.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Socket Latency: <code className="text-purple-300">{combinedResult.evmWs?.latencyMs}ms</code>
                </div>
              </div>

              {/* Card 3: Port 7777 */}
              <div className="bg-black/60 p-3 rounded-lg border border-emerald-900/50 space-y-1">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                  <span>Reality Bridge (7777)</span>
                  <span className="text-[9px] px-1 bg-emerald-950 text-emerald-300 rounded font-mono">SWEEP VERIFIED</span>
                </div>
                <div className="text-emerald-300 font-mono text-[11px] truncate">
                  Cold: {combinedResult.realityBridge?.boundExternalAddress}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Swept: <strong className="text-white">{combinedResult.realityBridge?.amountSwept}</strong>
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  Tx: <code className="text-zinc-300">{combinedResult.realityBridge?.lastSweepTx}</code>
                </div>
              </div>
            </div>
          )}

          {combinedResult.blockchainProof && (
            <div className="p-2.5 bg-black/80 rounded-lg border border-zinc-800 font-mono text-[10px] text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span className="text-amber-400 font-bold">PoI Block #{combinedResult.blockchainProof.blockNumber} Minted: </span>
                <span className="text-zinc-400 truncate">{combinedResult.blockchainProof.hash}</span>
              </div>
              <div className="text-zinc-500">
                Merkle Root: {combinedResult.blockchainProof.merkleRoot?.substring(0, 16)}...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single 8545 Test Result Display */}
      {testResult && !combinedResult && (
        <div
          className={`p-3 rounded-xl border ${
            testResult.success
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold flex items-center space-x-1.5">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span>
                {testResult.success
                  ? `RPC Connected! Current Block: #${testResult.blockNumber?.toLocaleString() || "N/A"}`
                  : "RPC Execution Failed"}
              </span>
            </span>
            <span className="text-[10px] text-zinc-400">
              Latency: {testResult.latencyMs}ms | Status: {testResult.status}
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 overflow-x-auto">
            Hex Result: <code className="text-zinc-200">{testResult.result}</code> | Target:{" "}
            <code className="text-zinc-200">{testResult.rpcUrl}</code>
          </div>
        </div>
      )}

      {/* Snippet Tabs */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "curl", label: "cURL (CLI)", icon: Terminal },
              { id: "wscat", label: "wscat (WebSocket)", icon: Radio },
              { id: "ethers", label: "Node.js (ethers.js)", icon: Code2 },
              { id: "python", label: "Python (web3.py)", icon: Cpu },
              { id: "ufw", label: "UFW Security (Firewall)", icon: Shield },
              { id: "tailscale", label: "Tailscale / ngrok (100.x.y.z)", icon: Server },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSnippetTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    activeSnippetTab === tab.id
                      ? "bg-zinc-800 text-cyan-400 font-bold border border-zinc-700"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(getActiveCode(), activeSnippetTab)}
            className="text-zinc-400 hover:text-white inline-flex items-center space-x-1 cursor-pointer text-xs"
          >
            {copiedKey === activeSnippetTab ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy Snippet</span>
          </button>
        </div>

        {/* Code display */}
        <pre className="bg-black/80 border border-zinc-800/80 rounded-xl p-3.5 text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
          {getActiveCode()}
        </pre>
      </div>
    </div>
  );
}
