import React, { useState } from "react";
import { Play, Terminal, Loader2, CheckCircle2, AlertCircle, Clock, Copy, Check } from "lucide-react";
import type { ScriptRunResult } from "../types";

interface ScriptOption {
  id: string;
  name: string;
  description: string;
  command: string;
  tag: string;
}

const SCRIPTS: ScriptOption[] = [
  {
    id: "unified-vault-harvester.js",
    name: "unified-vault-harvester.js (Unified Port)",
    description: "Consolidates all 4 project structures (Flash Loan, Music, Tether, DEX) into the Smart Contract Wallet Port with 5-Layer Anti-Loss Invariants",
    command: "node unified-vault-harvester.js",
    tag: "Unified Vault Port",
  },
  {
    id: "index.js",
    name: "index.js",
    description: "Standard generation with @google/genai & Node.js error resiliency",
    command: "node index.js",
    tag: "Gemini API",
  },
  {
    id: "stream.js",
    name: "stream.js",
    description: "Real-time response token streaming using for-await-of loop",
    command: "node stream.js",
    tag: "Streaming",
  },
  {
    id: "chat.js",
    name: "chat.js",
    description: "Multi-turn contextual conversational session (ai.chats.create)",
    command: "node chat.js",
    tag: "Chat Context",
  },
  {
    id: "structured.js",
    name: "structured.js",
    description: "Strict JSON schema enforcement with Type.OBJECT and Type.ARRAY",
    command: "node structured.js",
    tag: "JSON Schema",
  },
  {
    id: "cli-express.cjs",
    name: "cli-express.cjs",
    description: "CLI stdout logger, os.platform() inspection, and Express route",
    command: "node cli-express.cjs",
    tag: "CLI & OS",
  },
  {
    id: "hello-http.cjs",
    name: "hello-http.cjs",
    description: "Built-in Node.js http.createServer() listening on port 8080",
    command: "node hello-http.cjs",
    tag: "Raw HTTP",
  },
  {
    id: "read-file.cjs",
    name: "read-file.cjs",
    description: "Asynchronous fs.readFile('myfile.txt') non-blocking I/O & event loop order",
    command: "node read-file.cjs",
    tag: "Async fs",
  },
  {
    id: "variables-functions.js",
    name: "variables-functions.js",
    description: "Variables (let, const), template literals, and arrow functions (ES6+)",
    command: "node variables-functions.js",
    tag: "Fundamentals",
  },
  {
    id: "objects-arrays.js",
    name: "objects-arrays.js",
    description: "Objects, methods with 'this', array forEach, and map transformations",
    command: "node objects-arrays.js",
    tag: "Data Structures",
  },
  {
    id: "async-demo.js",
    name: "async-demo.js",
    description: "Callbacks, Promises, and modern Async/Await on the Node.js event loop",
    command: "node async-demo.js",
    tag: "Async JS",
  },
  {
    id: "destructuring-concepts.js",
    name: "destructuring-concepts.js",
    description: "Destructuring, try/catch error handling, and CommonJS vs ES Modules",
    command: "node destructuring-concepts.js",
    tag: "ES6 & Modules",
  },
  {
    id: "scanner.js",
    name: "scanner.js",
    description: "Multi-Pool DEX Price Scanner (Uniswap V3 × SushiSwap) with ethers.js and flash loan pipeline",
    command: "node scanner.js",
    tag: "DEX Scanner (ethers)",
  },
  {
    id: "run-bot-24-7.js",
    name: "run-bot-24-7.js (24/7 Bot)",
    description: "Live execution of 24/7 Multi-Chain Bot: ETH & BSC blocks, Solana slots, and Binance ticker",
    command: "node run-bot-24-7.js",
    tag: "24/7 Web3 Bot",
  },
  {
    id: "stealth-flashloan-bot.js",
    name: "stealth-flashloan-bot.js (MEV Shield)",
    description: "4-Stage Stealth Flash Loan Bot: Scanner -> Evaluator -> Local Simulation -> Flashbots Protect Private RPC",
    command: "node stealth-flashloan-bot.js",
    tag: "MEV-Resistant Bot",
  },
  {
    id: "bullivant-distro-pipeline.js",
    name: "bullivant-distro-pipeline.js (Music Distro)",
    description: "Automated music packaging & global distribution pipeline for Bullivant (DistroKid, TuneCore, Mdundo, Spotify)",
    command: "node bullivant-distro-pipeline.js",
    tag: "Bullivant Engine",
  },
  {
    id: "tether-mint-simulator.js",
    name: "tether-mint-simulator.js (Tether Mint Radar)",
    description: "$100,000 balance threshold radar, SWIFT bank wire clearance, and 4-phase institutional minting pipeline",
    command: "node tether-mint-simulator.js 100000",
    tag: "Tether Institutional",
  },
  {
    id: "node.js",
    name: "node.js (PoW Tri-Protocol Node)",
    description: "Proof-of-Work blockchain node with SHA-256 mining, TCP P2P mesh flooding, and UDP peer discovery scanner",
    command: "node node.js",
    tag: "P2P PoW Node",
  },
  {
    id: "p2p-node.cjs",
    name: "p2p-node.cjs (Canonical Tri-Protocol)",
    description: "Decoupled 3-layer architecture: HTTP (:3000 RPC), TCP (:6000 P2P Sync & Block Flooding), and UDP (:7000 Peer Discovery)",
    command: "node p2p-node.cjs",
    tag: "Tri-Protocol Mesh",
  },
  {
    id: "smart-contract-vm-engine.cjs",
    name: "smart-contract-vm-engine.cjs (VM Smart Contracts)",
    description: "Sandboxed bytecode execution inside blocks using Node.js native 'vm' module, gas limits & state roots",
    command: "node smart-contract-vm-engine.cjs",
    tag: "VM Smart Contracts",
  },
];

export function ScriptRunnerTerminal() {
  const [selectedScript, setSelectedScript] = useState<string>("index.js");
  const [running, setRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ScriptRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const runScript = async (scriptId?: string) => {
    const target = scriptId || selectedScript;
    if (running) return;
    setRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: target }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to execute script.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const currentOption = SCRIPTS.find((s) => s.id === selectedScript) || SCRIPTS[0];

  const copyOutput = () => {
    if (!result?.stdout) return;
    navigator.clipboard.writeText(result.stdout);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="script-runner-terminal" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Interactive Node.js CLI Script Runner</h3>
            <p className="text-xs text-zinc-500">
              Direct terminal execution inside the container with real stdout &amp; stderr
            </p>
          </div>
        </div>

        <button
          id="run-active-script-btn"
          type="button"
          onClick={() => runScript()}
          disabled={running}
          className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Executing Process...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Run {selectedScript}</span>
            </>
          )}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Script Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SCRIPTS.map((script) => (
            <button
              key={script.id}
              type="button"
              onClick={() => {
                setSelectedScript(script.id);
                runScript(script.id);
              }}
              disabled={running}
              className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                selectedScript === script.id
                  ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-900 truncate">{script.name}</span>
              </div>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                {script.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Script Info */}
        <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-zinc-500">$ {currentOption.command}</span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-600">{currentOption.description}</span>
          </div>
          {result?.durationMs !== undefined && (
            <div className="flex items-center space-x-1 text-zinc-500 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{result.durationMs}ms</span>
            </div>
          )}
        </div>

        {/* Terminal Output */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono text-[11px]">Terminal Console</span>
            {result?.stdout && (
              <button
                type="button"
                onClick={copyOutput}
                className="hover:text-zinc-800 text-zinc-400 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy Output"}</span>
              </button>
            )}
          </div>

          <div
            id="terminal-output-viewport"
            className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs leading-relaxed min-h-[160px] max-h-[300px] overflow-y-auto whitespace-pre-wrap border border-zinc-800 shadow-inner"
          >
            {running ? (
              <span className="text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Spawning child process: <code>{currentOption.command}</code>...
              </span>
            ) : result ? (
              <>
                <div className="text-zinc-500 border-b border-zinc-800 pb-1 mb-2 text-[11px]">
                  Process exited with {result.success ? "code 0 (SUCCESS)" : "ERROR"} in {result.durationMs}ms
                </div>
                {result.stdout && <div>{result.stdout}</div>}
                {result.stderr && <div className="text-amber-400 mt-2">{result.stderr}</div>}
              </>
            ) : (
              <span className="text-zinc-600">
                Select a script above or click &quot;Run {selectedScript}&quot; to execute inside the Node.js container environment.
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
