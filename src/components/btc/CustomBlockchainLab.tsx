import React, { useState, useEffect } from "react";
import {
  Boxes,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code,
  FileCode2,
  Radio,
} from "lucide-react";

interface CustomBlock {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  miningDurationMs?: number;
}

export function CustomBlockchainLab() {
  const [chain, setChain] = useState<CustomBlock[]>([]);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [errorReason, setErrorReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // New Block Form
  const [sender, setSender] = useState<string>("Alice");
  const [recipient, setRecipient] = useState<string>("Bob");
  const [amount, setAmount] = useState<number>(1.5);
  const [memo, setMemo] = useState<string>("Node.js Ledger Transfer");
  const [difficulty, setDifficulty] = useState<number>(2);
  const [miningResult, setMiningResult] = useState<any>(null);

  // Tamper Form
  const [tamperIndex, setTamperIndex] = useState<number>(1);
  const [tamperData, setTamperData] = useState<string>("HACKED: Transferred 999 BTC to Attacker");

  const fetchChain = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blockchain/chain");
      const data = await res.json();
      if (data.success) {
        setChain(data.chain);
        setIsChainValid(data.isChainValid);
        setErrorIndex(data.errorIndex);
        setErrorReason(data.reason || "");
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();
  }, []);

  const handleMineBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/blockchain/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { sender, recipient, amount, memo },
          difficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMiningResult({
          block: data.block,
          duration: data.block.miningDurationMs,
          nonce: data.block.nonce,
        });
        await fetchChain();
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  const handleTamper = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blockchain/tamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: tamperIndex,
          newData: { memo: tamperData, unauthorized: true },
        }),
      });
      const data = await res.json();
      setIsChainValid(data.isChainValid);
      setErrorIndex(data.errorIndex);
      setErrorReason(data.reason || "");
      if (data.chain) setChain(data.chain);
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blockchain/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setChain(data.chain);
        setIsChainValid(true);
        setErrorIndex(null);
        setErrorReason("");
        setMiningResult(null);
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ⛓️
              </span>
              <h3 className="text-base font-bold text-zinc-900">
                Custom Node.js Blockchain Engine & P2P Lab
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  isChainValid
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {isChainValid ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Chain Verified & Intact
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Tampered / Invalid Chain!
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
              Experience how an asynchronous Node.js architecture builds a cryptographic ledger from scratch. Blocks calculate SHA-256 hashes via <code className="font-mono bg-zinc-100 px-1 rounded text-zinc-800">node:crypto</code>, mine Proof-of-Work nonces, and link to previous hashes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Reset Genesis Chain
            </button>
          </div>
        </div>

        {/* Warning if tampered */}
        {!isChainValid && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cryptographic Integrity Violation Detected!</p>
              <p className="mt-0.5 text-red-700">{errorReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Blocks Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-zinc-700" />
            Live Block Ledger ({chain.length} Blocks Linked)
          </h4>
          <span className="text-[11px] text-zinc-500">
            Click any block to inspect cryptographic payload
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chain.map((b, idx) => {
            const isGenesis = b.index === 0;
            const isFaulty = errorIndex !== null && b.index >= errorIndex;

            return (
              <div
                key={b.index}
                className={`relative rounded-xl border p-4 transition-all shadow-xs ${
                  isFaulty
                    ? "bg-red-50/50 border-red-300 ring-1 ring-red-400"
                    : isGenesis
                    ? "bg-amber-50/30 border-amber-200"
                    : "bg-white border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-mono">
                      #{b.index}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">
                      {isGenesis ? "Genesis Block" : `Block #${b.index}`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                    Nonce: {b.nonce}
                  </span>
                </div>

                {/* Hash Details */}
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-zinc-500 font-medium block">Current Hash (SHA-256):</span>
                    <div className="font-mono text-zinc-800 break-all bg-zinc-50 p-1.5 rounded border border-zinc-200/80 text-[10px]">
                      <span className="text-amber-600 font-bold">
                        {b.hash.substring(0, b.difficulty)}
                      </span>
                      {b.hash.substring(b.difficulty)}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-medium block">Previous Hash:</span>
                    <div className="font-mono text-zinc-600 truncate bg-zinc-50 p-1.5 rounded border border-zinc-200/80 text-[10px]">
                      {b.previousHash}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-medium block">Payload Data:</span>
                    <pre className="font-mono text-[10px] text-zinc-700 bg-zinc-50 p-1.5 rounded border border-zinc-200/80 overflow-x-auto max-h-20">
                      {JSON.stringify(b.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] text-zinc-500">
                  <span>PoW Difficulty: {b.difficulty}</span>
                  {b.miningDurationMs !== undefined && (
                    <span className="text-emerald-700 font-semibold">
                      Mined in {b.miningDurationMs}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Control Panels: Mine New Block vs Tamper Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Mine New Block */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-zinc-900">
              Mine Block (Proof-of-Work Simulator)
            </h4>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Simulates miner computing power solving Proof-of-Work by hashing iteratively until the hash has the required number of leading zeroes.
          </p>

          <form onSubmit={handleMineBlock} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Sender
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  PoW Difficulty (Leading Zeros)
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 Zero (Fast / ~1-5 iterations)</option>
                  <option value={2}>2 Zeros (Standard / ~100-300 iterations)</option>
                  <option value={3}>3 Zeros (High / ~1,000-5,000 iterations)</option>
                  <option value={4}>4 Zeros (Very High / ~50,000+ iterations)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                Transaction Memo / Note
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              Mine Block #{chain.length} & Broadcast to Peers
            </button>
          </form>

          {miningResult && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-bold">✅ Block Mined Successfully!</span> Nonce: {miningResult.nonce} iterations in {miningResult.duration}ms.
            </div>
          )}
        </div>

        {/* Panel B: Tamper Simulation */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-zinc-900">
              Tamper & Attack Simulation Lab
            </h4>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Demonstrates why blockchains are immutable. If an attacker tampers with a historical transaction, the calculated SHA-256 hash no longer matches and previousHash pointers break!
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                Target Block to Tamper
              </label>
              <select
                value={tamperIndex}
                onChange={(e) => setTamperIndex(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-red-500 font-mono"
              >
                {chain.map((b) => (
                  <option key={b.index} value={b.index}>
                    Block #{b.index} ({b.index === 0 ? "Genesis" : "Transaction Block"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                Tampered Data Content
              </label>
              <input
                type="text"
                value={tamperData}
                onChange={(e) => setTamperData(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-red-300 bg-red-50/20 focus:outline-none focus:border-red-500 text-red-900 font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
              <span className="font-semibold text-zinc-800">Verification Logic:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-zinc-600">
                <li>Block SHA-256 hash must match data recalculation.</li>
                <li>Each block's <code className="font-mono text-zinc-800">previousHash</code> must match prior block.</li>
                <li>Tampering one block invalidates every subsequent block!</li>
              </ul>
            </div>

            <button
              onClick={handleTamper}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Execute Tamper Injection on Block #{tamperIndex}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
