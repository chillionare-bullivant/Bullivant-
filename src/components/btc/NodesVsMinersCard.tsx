import React, { useState } from "react";
import { HardDrive, Cpu, ShieldCheck, CheckCircle2, Zap, Scale, Server } from "lucide-react";

export function NodesVsMinersCard() {
  const [selectedSpec, setSelectedSpec] = useState<"umbrel" | "core">("umbrel");

  return (
    <div className="space-y-6">
      {/* Nodes vs Miners Deep Dive */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              ⚖️
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Nodes vs. Miners: The Consensus Architecture
              </h3>
              <p className="text-xs text-zinc-500">
                Zero nodes are required to mine Bitcoin, because nodes do not mine — they audit and referee.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            ~116,000+ Global Auditing Nodes
          </span>
        </div>

        {/* 2 Column Comparison: The Referees vs The Workers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Nodes Card */}
          <div className="p-4 rounded-xl border border-sky-200/90 bg-sky-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                The Referees (Full Nodes)
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                Bitcoin Core / bitcoind
              </span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Role:</strong> Stores a full copy of the blockchain ledger (~650+ GB) and verifies every block.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Consensus Enforcement:</strong> Independently validates cryptographic signatures, double-spending rules, and block sizes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Hardware:</strong> Low power! Any 64-bit CPU (Raspberry Pi, Mini PC) + 2TB SSD + 4-8GB RAM.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Sovereignty:</strong> Eliminates reliance on 3rd parties (Infura, Alchemy) for wallet balances.</span>
              </li>
            </ul>
          </div>

          {/* Miners Card */}
          <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                The Workers (Miners)
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                ASIC Hardware Clusters
              </span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Role:</strong> Uses massive hash rate to solve SHA-256 Proof-of-Work puzzles and bundle transactions into blocks.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Block Reward:</strong> <strong>3.125 BTC</strong> per block (post-April 2024 halving) roughly every 10 minutes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Global Speed:</strong> Network generates ~0.3125 BTC/min; takes ~3.2 minutes of global hash power to produce 1 BTC.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Referee Subservience:</strong> If a miner submits an invalid block, nodes reject it instantly; miner loses all burned energy.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hardware Specifications & Setup Planner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-600" />
              Full Node Hardware Specs & Deployment Blueprint
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              You do not need expensive mining rigs to run a sovereign full node. Recommended specs for 24/7 reliability:
            </p>
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSpec("umbrel")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedSpec === "umbrel"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Option 1: Raspberry Pi / Umbrel
            </button>
            <button
              onClick={() => setSelectedSpec("core")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedSpec === "core"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Option 2: Desktop / Mini PC
            </button>
          </div>
        </div>

        {/* Hardware Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Component</th>
                <th className="py-2.5 px-3">Minimum Requirement</th>
                <th className="py-2.5 px-3">Recommended Setup</th>
                <th className="py-2.5 px-3">Engineering Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                  Storage
                </td>
                <td className="py-2.5 px-3 font-mono">1 TB External/Internal</td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">2 TB NVMe / SATA SSD</td>
                <td className="py-2.5 px-3 text-zinc-600">Blockchain is ~650 GB+ and growing. Mechanical HDDs are too slow for Initial Block Download (IBD).</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  Processor / CPU
                </td>
                <td className="py-2.5 px-3 font-mono">Any 64-bit CPU</td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                  {selectedSpec === "umbrel" ? "Raspberry Pi 5 (quad 2.4GHz)" : "Intel N100 / AMD Ryzen Mini PC"}
                </td>
                <td className="py-2.5 px-3 text-zinc-600">Once initial sync is complete, verification uses minimal CPU (~5-10% of 1 core).</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-amber-600" />
                  RAM Memory
                </td>
                <td className="py-2.5 px-3 font-mono">2 GB RAM</td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">8 GB RAM (DDR4/DDR5)</td>
                <td className="py-2.5 px-3 text-zinc-600">Allocates larger dbcache (e.g. `dbcache=4096`), speeding up IBD from weeks to 2-3 days.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  Network & Power
                </td>
                <td className="py-2.5 px-3 font-mono">50GB up / 20GB down</td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">Uncapped Fiber + UPS Backup</td>
                <td className="py-2.5 px-3 text-zinc-600">Nodes upload blocks to new peers. Uninterruptible Power Supply (UPS) prevents LevelDB database corruption on sudden outage.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
