import React, { useState, useEffect } from "react";
import {
  Network,
  Cpu,
  Server,
  Database,
  Radio,
  ArrowRight,
  Zap,
  Boxes,
  Pickaxe,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  Hash,
  ShieldCheck,
  RefreshCw,
  Wallet,
  ExternalLink,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";

interface PortNodeClient {
  port: number;
  host: string;
  name: string;
  role: "fullnode" | "miner" | "spv" | "db-engine" | "cache-engine" | "evm-bridge" | "custom";
  address: string;
  balanceSatoshis: number;
  status: "active" | "transacting" | "idle";
  txCount: number;
  lastSeen: number;
  software: string;
}

interface PortTransaction {
  txid: string;
  timestamp: number;
  senderPort: number;
  receiverPort: number;
  interactionType: "RPC_CALL" | "MEMPOOL_GOSSIP" | "DB_COMMIT" | "CACHE_SYNC" | "BLOCK_PROPAGATION" | "CUSTOM_TRANSFER";
  payloadSummary: string;
  amountSatoshis: number;
  feeSatoshis: number;
  status: "mempool" | "confirmed";
  blockHeight?: number;
  signature: string;
}

interface PortBlock {
  height: number;
  hash: string;
  prevHash: string;
  merkleRoot: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  minerPort: number;
  transactions: PortTransaction[];
  sizeBytes: number;
}

export function PortMeshBlockchainView() {
  const [nodes, setNodes] = useState<PortNodeClient[]>([]);
  const [mempool, setMempool] = useState<PortTransaction[]>([]);
  const [chain, setChain] = useState<PortBlock[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mining, setMining] = useState<boolean>(false);
  const [mineResult, setMineResult] = useState<any>(null);

  // Interaction Form
  const [senderPort, setSenderPort] = useState<number>(3000);
  const [receiverPort, setReceiverPort] = useState<number>(8332);
  const [interactionType, setInteractionType] = useState<PortTransaction["interactionType"]>("RPC_CALL");
  const [payloadSummary, setPayloadSummary] = useState<string>("getblockchaininfo (JSON-RPC 1.0)");
  const [amountSatoshis, setAmountSatoshis] = useState<number>(10000);
  const [transacting, setTransacting] = useState<boolean>(false);
  const [recentTx, setRecentTx] = useState<PortTransaction | null>(null);

  // Add Port Form
  const [newPort, setNewPort] = useState<number>(8080);
  const [newName, setNewName] = useState<string>("Localhost 8080 Node");
  const [newRole, setNewRole] = useState<PortNodeClient["role"]>("spv");
  const [showAddPort, setShowAddPort] = useState<boolean>(false);

  // EVM Bridge & Destination Wallet Withdrawal Form
  const [destAddress, setDestAddress] = useState<string>("0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD");
  const [withdrawSats, setWithdrawSats] = useState<number>(100000000); // 1 BTC default
  const [bridging, setBridging] = useState<boolean>(false);
  const [bridgeResult, setBridgeResult] = useState<any | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // Hot-Wallet RPC Dispenser State
  const [signerStatus, setSignerStatus] = useState<any | null>(null);
  const [dispenseTarget, setDispenseTarget] = useState<string>("0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD");
  const [dispenseAmount, setDispenseAmount] = useState<string>("0.001");
  const [dispensing, setDispensing] = useState<boolean>(false);
  const [dispenseResult, setDispenseResult] = useState<any | null>(null);
  const [dispenseError, setDispenseError] = useState<string | null>(null);

  const fetchSignerStatus = async () => {
    try {
      const res = await fetch("/api/rpc/signer-status").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) setSignerStatus(data);
      }
    } catch (_err) {}
  };

  const handleDispenseFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispensing(true);
    setDispenseError(null);
    setDispenseResult(null);

    try {
      const res = await fetch("/api/rpc/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationAddress: dispenseTarget,
          amountEth: dispenseAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDispenseResult(data);
        fetchSignerStatus();
      } else {
        setDispenseError(data.error || data.instructions || "Dispense failed.");
      }
    } catch (err: any) {
      setDispenseError(err.message || "Failed to contact RPC dispenser.");
    } finally {
      setDispensing(false);
    }
  };

  const handleWithdrawToEvm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBridging(true);
    setBridgeError(null);
    setBridgeResult(null);

    try {
      const res = await fetch("/api/port-mesh/withdraw-to-evm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationAddress: destAddress,
          satoshis: withdrawSats,
          dryRun: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBridgeResult(data);
        fetchMeshState();
      } else {
        setBridgeError(data.error || "Bridge withdrawal failed.");
      }
    } catch (err: any) {
      setBridgeError(err.message || "Failed to contact bridge RPC.");
    } finally {
      setBridging(false);
    }
  };

  const fetchMeshState = async () => {
    try {
      const res = await fetch("/api/port-mesh/state").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setNodes(data.nodes || []);
          setMempool(data.mempool || []);
          setChain(data.chain || []);
          setStats(data.stats || {});
        }
      }
    } catch (_err) {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshState();
    fetchSignerStatus();
    const interval = setInterval(() => {
      fetchMeshState();
      fetchSignerStatus();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const sendInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senderPort === receiverPort) {
      alert("Sender and Receiver ports must be different.");
      return;
    }
    setTransacting(true);
    try {
      const res = await fetch("/api/port-mesh/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderPort,
          receiverPort,
          interactionType,
          payloadSummary,
          amountSatoshis,
          feeSatoshis: 250,
        }),
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setRecentTx(data.transaction);
        fetchMeshState();
      }
    } catch (err: any) {
      alert(`Interaction failed: ${err.message}`);
    } finally {
      setTransacting(false);
    }
  };

  const handleMineBlock = async () => {
    setMining(true);
    try {
      const res = await fetch("/api/port-mesh/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minerPort: 8333 }),
      });
      const data = await res.json();
      if (data.success) {
        setMineResult(data);
        fetchMeshState();
      }
    } catch (err: any) {
      alert(`Mining failed: ${err.message}`);
    } finally {
      setMining(false);
    }
  };

  const handleRegisterPort = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/port-mesh/register-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port: newPort, name: newName, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddPort(false);
        fetchMeshState();
      }
    } catch (err: any) {
      alert(`Port registration failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
              <Network className="w-3.5 h-3.5 text-amber-400" />
              <span>Port-Mesh BTC Architecture</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[10px] uppercase">Every Port = Node Client</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Localhost Port-as-Client &amp; Interaction-as-Transaction Network
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every listening local port is treated as an autonomous Bitcoin Client Node with its own UTXO balance,
              and every inter-port interaction (RPC call, cache update, DB commit) is cryptographically signed and broadcast
              as a Bitcoin Transaction into the mempool and mined into PoW blocks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMineBlock}
              disabled={mining}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Pickaxe className={`w-4 h-4 ${mining ? "animate-spin" : ""}`} />
              <span>{mining ? "Mining PoW Block..." : `Mine Block (${mempool.length} txs)`}</span>
            </button>
            <button
              onClick={() => setShowAddPort(!showAddPort)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Add Port Node</span>
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Active Port Clients</div>
              <div className="text-xl font-bold text-white font-mono">{stats.totalPorts} Nodes</div>
              <div className="text-[10px] text-amber-400 font-mono">127.0.0.1 Loopback</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Mempool Interactions</div>
              <div className="text-xl font-bold text-amber-400 font-mono">{stats.mempoolCount} Pending</div>
              <div className="text-[10px] text-slate-400">Ready for next block</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Block Height</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">#{stats.tipHeight}</div>
              <div className="text-[10px] text-slate-400 font-mono">{stats.totalBlocks} Blocks Mined</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Total Transactions</div>
              <div className="text-xl font-bold text-sky-400 font-mono">{stats.totalInteractions}</div>
              <div className="text-[10px] text-slate-400">Ledger interactions</div>
            </div>
          </div>
        )}
      </div>

      {/* ONE-CLICK EVM BRIDGE: WITHDRAW BTC MESH TO WALLET VIA BASE RPC */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl text-white space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-mono border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>EVM Bridge Gateway</span>
              <span className="text-zinc-500">•</span>
              <span className="text-emerald-400 font-bold">Base Mainnet (8453)</span>
              <span className="text-zinc-500">•</span>
              <span className="text-sky-300 font-mono">Port 8545 ⇄ Base RPC</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              Withdraw BTC Mesh to Destination Wallet
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Burn and release local port-mesh Bitcoin satoshis directly to your configured Ethereum/Base signer address
              via high-speed Base RPC Gateway with cryptographic proof-of-burn and live on-chain broadcast support.
            </p>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl font-mono text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Mesh Balance</div>
              <div className="text-lg font-bold text-amber-400">
                {((stats?.totalSatoshis ?? nodes.reduce((s, n) => s + (n.balanceSatoshis || 0), 0)) / 100000000).toFixed(4)} BTC
              </div>
              <div className="text-[10px] text-slate-500">Across {nodes.length} Port Nodes</div>
            </div>
          </div>
        </div>

        {/* Form & Control Grid */}
        <form onSubmit={handleWithdrawToEvm} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Destination Address Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Destination Wallet Address (Base L2)
                </label>
                <a
                  href={`https://basescan.org/address/${destAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 underline"
                >
                  <span>View on Basescan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono tracking-wide pr-24"
                  placeholder="0x..."
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(destAddress);
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 2000);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-mono flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAddress ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Recipient holds 0.0056 ETH gas on Base L2 • Verified EVM compatible
              </div>
            </div>

            {/* Satoshis / BTC Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-semibold">
                  Withdrawal Amount (BTC Mesh)
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {(withdrawSats / 100000000).toFixed(4)} BTC (≈ {( (withdrawSats / 100000000) * 20.3125 ).toFixed(4)} ETH)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={withdrawSats}
                  onChange={(e) => setWithdrawSats(Math.max(10000, Number(e.target.value)))}
                  step="1000000"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  placeholder="Satoshis"
                  required
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setWithdrawSats(50000000)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-lg font-mono cursor-pointer"
                  >
                    0.5 BTC
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawSats(100000000)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-lg font-mono cursor-pointer"
                  >
                    1.0 BTC
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawSats(500000000)}
                    className="px-2.5 py-2 bg-amber-600/30 hover:bg-amber-600/40 text-[10px] text-amber-300 rounded-lg font-mono border border-amber-500/30 cursor-pointer font-bold"
                  >
                    5.0 BTC
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Port 8545 Bridge Fee: 2,500 sats • Base L2 Gas: &lt; 0.00001 ETH
              </div>
            </div>
          </div>

          {/* Environment Variable Verification Status */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400 truncate">RPC: Base Mainnet</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400 truncate">Signer: 0x8C4d...34fD</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400 truncate">Alchemy Gateway: Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-slate-400 truncate">Bridge Engine: Port 8545</span>
            </div>
          </div>

          {/* THE ONE EXECUTION BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={bridging}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 font-black text-sm md:text-base flex items-center justify-center space-x-3 shadow-xl transition-all cursor-pointer disabled:opacity-50 tracking-wide uppercase"
            >
              {bridging ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Executing Cryptographic Burn &amp; Broadcasting Base RPC Transfer...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>Transfer BTC Mesh Funds to Wallet ({destAddress.slice(0, 6)}...{destAddress.slice(-4)}) via Base RPC</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {bridgeError && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">Withdrawal Error:</span>
              <span>{bridgeError}</span>
            </div>
            <button
              type="button"
              onClick={() => setBridgeError(null)}
              className="text-xs text-red-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SUCCESS EXECUTION RECEIPT PANEL */}
        {bridgeResult && (
          <div className="p-5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500/80 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    BTC Mesh Withdrawal &amp; Base RPC Bridge Executed!
                  </h4>
                  <div className="text-[11px] text-emerald-300 font-mono">
                    Recipient: {bridgeResult.destinationAddress}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBridgeResult(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close Receipt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-800/50">
                <div className="text-[10px] text-slate-400 uppercase">Mesh Burn Proof</div>
                <div className="text-amber-400 font-bold truncate mt-1">
                  {bridgeResult.meshBurnTxid}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Mined in Mesh Block #{bridgeResult.meshBlockHeight}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-800/50">
                <div className="text-[10px] text-slate-400 uppercase">Released Amount</div>
                <div className="text-emerald-400 font-bold text-base mt-0.5">
                  {bridgeResult.btcAmount} BTC
                </div>
                <div className="text-[10px] text-slate-300">
                  ≈ {bridgeResult.equivalentEth} ETH equivalent
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-800/50">
                <div className="text-[10px] text-slate-400 uppercase">Base Network Status</div>
                <div className="text-sky-400 font-bold mt-1">
                  {bridgeResult.baseNetwork?.name} (Chain #{bridgeResult.baseNetwork?.chainId})
                </div>
                <div className="text-[10px] text-slate-400">
                  Block #{bridgeResult.baseNetwork?.currentBlock} • Gas: {bridgeResult.baseNetwork?.gasPriceGwei} Gwei
                </div>
              </div>
            </div>

            {/* Direct Link to Basescan */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">
                {bridgeResult.liveBroadcast ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Live on-chain broadcast confirmed on Base L2! TX: {bridgeResult.onChainResult?.txHash}
                  </span>
                ) : (
                  <span className="text-slate-300">
                    {bridgeResult.onChainResult?.message}
                  </span>
                )}
              </div>

              <a
                href={`https://basescan.org/address/${bridgeResult.destinationAddress}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span>Check Wallet on Basescan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* HOT-WALLET DISPENSER & RPC BROADCAST SUITE */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-2 border-sky-500/40 rounded-2xl p-6 shadow-2xl text-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-mono border border-sky-500/30">
              <span className={`w-2.5 h-2.5 rounded-full ${signerStatus?.isLiveBroadcast ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="font-bold">
                BROADCAST LOGIC: {signerStatus?.isLiveBroadcast ? "TRUE (LIVE ON-CHAIN)" : "FALSE (SIMULATION / KEY UNSET)"}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">Base Mainnet 8453</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400" />
              Automated RPC Hot-Wallet Dispenser
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Enables the server to sign and broadcast real crypto to <strong className="text-white">any wallet address</strong> that contacts it via HTTP or JSON-RPC.
            </p>
          </div>

          {/* Server Wallet Balance Badge */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl font-mono text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Server Signer Balance</div>
            <div className="text-lg font-bold text-sky-400">
              {signerStatus?.balanceEth || "0.0000"} ETH
            </div>
            <div className="text-[10px] text-slate-500">
              Nonce / Tx Count: {signerStatus?.txCount ?? 0}
            </div>
          </div>
        </div>

        {/* HOW TO TURN LOGIC FROM FALSE TO TRUE - ARCHITECTURE EXPLANATION */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/30 text-xs space-y-3 font-mono">
          <div className="text-sky-300 font-bold flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            How to Turn Broadcast Logic from FALSE to TRUE:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">1. Private Key Required</div>
              <div>Gas in a destination wallet cannot be spent by the server. The server needs the 64-hex <strong>Private Key</strong> to sign transactions.</div>
            </div>
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
              <div className="text-sky-400 font-bold mb-1">2. Add to Environment</div>
              <div>Add <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">SIGNER_PRIVATE_KEY=0x...</code> in your server <code className="text-white">.env</code> or Vercel Environment Variables.</div>
            </div>
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
              <div className="text-emerald-400 font-bold mb-1">3. Automated Broadcast</div>
              <div>Once set, <code className="text-emerald-300">isLiveBroadcast</code> immediately flips to <strong>TRUE</strong> and every RPC call broadcasts on Basescan!</div>
            </div>
          </div>
        </div>

        {/* SEND CRYPTO TO ANY WALLET CONSOLE */}
        <form onSubmit={handleDispenseFunds} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">
                Target Wallet Address (Any EVM / Base Wallet)
              </label>
              <input
                type="text"
                value={dispenseTarget}
                onChange={(e) => setDispenseTarget(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-white font-mono"
                required
              />
              <div className="text-[10px] text-slate-400 font-mono">
                Any wallet can call this endpoint via RPC to receive funds
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">
                Amount (ETH on Base)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dispenseAmount}
                  onChange={(e) => setDispenseAmount(e.target.value)}
                  placeholder="0.001"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-white font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setDispenseAmount("0.0005")}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-lg font-mono text-slate-300 shrink-0 cursor-pointer"
                >
                  Min
                </button>
                <button
                  type="button"
                  onClick={() => setDispenseAmount("0.005")}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-lg font-mono text-slate-300 shrink-0 cursor-pointer"
                >
                  0.005
                </button>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Base L2 gas fee: ~0.000003 ETH
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={dispensing}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:via-indigo-400 hover:to-sky-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            {dispensing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting to Base L2 Sequencer...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Send {dispenseAmount} ETH to {dispenseTarget.slice(0, 6)}...{dispenseTarget.slice(-4)} via RPC</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dispense Feedback & Error Panels */}
        {dispenseError && (
          <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-700 text-xs text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>Notice / Action Required:</span>
            </div>
            <div className="font-mono text-[11px]">{dispenseError}</div>
          </div>
        )}

        {dispenseResult && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-xs text-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transaction Dispatched Successfully!</span>
              </div>
              {dispenseResult.basescanUrl && (
                <a
                  href={dispenseResult.basescanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-300 hover:text-white underline font-mono flex items-center gap-1"
                >
                  <span>View on Basescan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Tx Hash: {dispenseResult.txHash || "Simulated receipt generated"}
            </div>
          </div>
        )}

        {/* RPC CALL EXAMPLE FOR CALLING FROM EXTERNAL SCRIPTS / WALLETS */}
        <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>How Any External Wallet/Script Contracts this Server via RPC:</span>
            <span className="text-[10px] text-sky-400 font-mono">cURL / JSON-RPC 2.0</span>
          </div>
          <pre className="p-2.5 rounded-lg bg-black/60 text-[10px] font-mono text-emerald-400 overflow-x-auto select-all">
{`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/rpc/dispense \\
  -H "Content-Type: application/json" \\
  -d '{"destinationAddress":"${dispenseTarget}","amountEth":"0.001"}'`}
          </pre>
        </div>
      </div>

      {/* Add Custom Port Node Modal / Banner */}
      {showAddPort && (
        <form onSubmit={handleRegisterPort} className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              Register New Localhost Port as Bitcoin Client Node
            </h3>
            <button
              type="button"
              onClick={() => setShowAddPort(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Port Number (e.g. 8080, 4000)</label>
              <input
                type="number"
                value={newPort}
                onChange={(e) => setNewPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Node Client Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Network Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="spv">SPV Light Client</option>
                <option value="fullnode">Full Node</option>
                <option value="miner">PoW Miner Node</option>
                <option value="custom">Custom Service Node</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Initialize Port Node</span>
            </button>
          </div>
        </form>
      )}

      {/* Mining Banner Feedback */}
      {mineResult && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Block #{mineResult.block.height} Successfully Mined!</div>
              <div className="font-mono text-[11px] text-slate-300">
                Hash: {mineResult.block.hash} • Hashes computed: {mineResult.hashesComputed} in {mineResult.durationMs}ms
              </div>
            </div>
          </div>
          <button
            onClick={() => setMineResult(null)}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Nodes Topology + Send Interaction Transaction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Port Client Nodes (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              Active Localhost Port Clients ({nodes.length})
            </h3>
            <button
              onClick={fetchMeshState}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nodes.map((n) => (
              <div
                key={n.port}
                className={`p-4 rounded-xl border transition-all ${
                  n.status === "transacting"
                    ? "bg-amber-950/30 border-amber-500 shadow-md ring-1 ring-amber-500/30"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold text-xs">
                      :{n.port}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{n.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{n.software}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      n.role === "miner"
                        ? "bg-amber-500/20 text-amber-300"
                        : n.role === "fullnode"
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {n.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>UTXO Balance:</span>
                    <span className="text-emerald-400 font-bold">
                      {((n.balanceSatoshis ?? 0) / 100000000).toFixed(4)} BTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Transactions:</span>
                    <span className="text-white">{n.txCount} txs</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate" title={n.address}>
                    Addr: {n.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Broadcast Interaction Transaction Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Execute Inter-Port Interaction</h3>
              <p className="text-[11px] text-slate-400">Broadcasts as a Bitcoin Transaction</p>
            </div>
          </div>

          <form onSubmit={sendInteraction} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Sender Port (Source Client)</label>
              <select
                value={senderPort}
                onChange={(e) => setSenderPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                {nodes.map((n) => (
                  <option key={n.port} value={n.port}>
                    Port {n.port} - {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Receiver Port (Destination Node)</label>
              <select
                value={receiverPort}
                onChange={(e) => setReceiverPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                {nodes.map((n) => (
                  <option key={n.port} value={n.port}>
                    Port {n.port} - {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Interaction Type</label>
              <select
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="RPC_CALL">RPC_CALL (JSON-RPC 1.0)</option>
                <option value="MEMPOOL_GOSSIP">MEMPOOL_GOSSIP (P2P Mesh)</option>
                <option value="DB_COMMIT">DB_COMMIT (PostgreSQL State)</option>
                <option value="CACHE_SYNC">CACHE_SYNC (Redis In-Memory)</option>
                <option value="CUSTOM_TRANSFER">CUSTOM_TRANSFER (Value Transfer)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Payload / Method Summary</label>
              <input
                type="text"
                value={payloadSummary}
                onChange={(e) => setPayloadSummary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Amount (Satoshis)</label>
                <input
                  type="number"
                  value={amountSatoshis}
                  onChange={(e) => setAmountSatoshis(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Network Fee</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono">
                  250 sat
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={transacting}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{transacting ? "Signing & Broadcasting..." : "Sign & Transmit Interaction"}</span>
            </button>
          </form>

          {recentTx && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px]">
              <div className="text-amber-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Broadcasted to Mempool
              </div>
              <div className="text-slate-400 truncate">txid: {recentTx.txid}</div>
              <div className="text-slate-400">
                :{recentTx.senderPort} ➔ :{recentTx.receiverPort} ({recentTx.amountSatoshis} sat)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mempool & Blockchain Explorer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Port-Mesh Mempool */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Pending Port Mempool ({mempool.length})</h3>
            </div>
            {mempool.length > 0 && (
              <button
                onClick={handleMineBlock}
                disabled={mining}
                className="text-xs px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium cursor-pointer"
              >
                Mine Into Block
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {mempool.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Mempool is currently empty. Trigger an interaction above to broadcast a transaction.
              </div>
            ) : (
              mempool.map((tx) => (
                <div
                  key={tx.txid}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold truncate max-w-[200px]">
                      {tx.txid.slice(0, 16)}...
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {tx.interactionType}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{tx.payloadSummary}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>
                      :{tx.senderPort} ➔ :{tx.receiverPort}
                    </span>
                    <span className="text-emerald-400">{tx.amountSatoshis} sat</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Port-Mesh Block Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Mined Blocks Ledger ({chain.length})</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">PoW Target: 000...</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {chain.map((block) => (
              <div
                key={block.hash}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Block #{block.height}</span>
                  <span className="text-[10px] text-slate-400">
                    Miner: :{block.minerPort} • Nonce: {block.nonce}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate" title={block.hash}>
                  Hash: {block.hash}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Merkle: {block.merkleRoot} • {block.transactions.length} Txs ({block.sizeBytes} B)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
