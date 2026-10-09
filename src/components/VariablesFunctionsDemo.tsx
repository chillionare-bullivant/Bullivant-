import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  Sparkles,
  Server,
  Calculator,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import type { VariablesFunctionsResult } from "../types";

const CODE_SNIPPET = `// Variables (let, const, var)
let name = 'Node.js';
const version = 20;

// Function declaration
function greet(user) {
  return \`Hello, \${user}!\`; // Template literal (ES6)
}

// Arrow function (ES6+)
const add = (a, b) => a + b;

console.log(greet('Developer')); // Hello, Developer!
console.log(add(5, 3)); // 8`;

export function VariablesFunctionsDemo() {
  const [userName, setUserName] = useState<string>("Developer");
  const [numA, setNumA] = useState<number>(5);
  const [numB, setNumB] = useState<number>(3);
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<VariablesFunctionsResult | null>({
    success: true,
    command: 'node variables-functions.js "Developer" 5 3',
    inputs: { user: "Developer", num1: 5, num2: 3 },
    greetOutput: "Hello, Developer!",
    addOutput: 8,
    stdout: "Hello, Developer!\n8\n",
    stderr: "",
    durationMs: 42,
  });
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCode = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/run-variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userName,
          num1: numA,
          num2: numB,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to execute in Node.js");
      }
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      id="variables-functions-card"
      className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Variables and Functions
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center space-x-1">
                <Server className="w-3 h-3" />
                <span>Get your own Node.js Server</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Modern JavaScript (ES6+) declarations, template literals, and arrow functions in the Node.js runtime
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="copy-vars-code-btn"
            type="button"
            onClick={handleCopy}
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Code Snippet & Reference */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>variables-functions.js</span>
              </span>
              <span className="text-[11px] text-zinc-400">Node.js ES6+</span>
            </div>

            {/* Code Display */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-4 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="text-emerald-300/95">
                <code>{CODE_SNIPPET}</code>
              </pre>
            </div>

            {/* Educational Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  1. Variables
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  <code className="text-zinc-800 font-mono">let</code> allows reassignment;{" "}
                  <code className="text-zinc-800 font-mono">const</code> creates immutable bindings.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  2. Function
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  <code className="text-zinc-800 font-mono">greet(user)</code> uses ES6 template literals{" "}
                  <code className="text-zinc-800 font-mono">`...`</code> for interpolation.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  3. Arrow Function
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  <code className="text-zinc-800 font-mono">(a, b) =&gt; a + b</code> provides clean syntax with implicit return.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Execution */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Live Interactive Execution</span>
              </span>
              <button
                id="run-variables-btn"
                type="button"
                onClick={executeCode}
                disabled={running}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>{running ? "Executing..." : "Run in Node.js"}</span>
              </button>
            </div>

            {/* Parameter Controls */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Interactive Arguments:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-zinc-400" />
                    <span>User Name</span>
                  </label>
                  <input
                    id="var-user-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    placeholder="Developer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center space-x-1">
                    <Calculator className="w-3 h-3 text-zinc-400" />
                    <span>Number a</span>
                  </label>
                  <input
                    id="var-numa-input"
                    type="number"
                    value={numA}
                    onChange={(e) => setNumA(Number(e.target.value))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center space-x-1">
                    <Calculator className="w-3 h-3 text-zinc-400" />
                    <span>Number b</span>
                  </label>
                  <input
                    id="var-numb-input"
                    type="number"
                    value={numB}
                    onChange={(e) => setNumB(Number(e.target.value))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Live Terminal Output */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
              <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Node.js Process Output (stdout)</span>
                </div>
                {result && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exit code: 0</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-3">
                {result ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-900/90 p-2.5 rounded border border-zinc-800">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">
                          greet(&apos;{result.inputs.user}&apos;)
                        </div>
                        <div
                          id="greet-output-val"
                          className="text-emerald-400 font-bold text-sm mt-0.5"
                        >
                          {result.greetOutput}
                        </div>
                      </div>

                      <div className="bg-zinc-900/90 p-2.5 rounded border border-zinc-800">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">
                          add({result.inputs.num1}, {result.inputs.num2})
                        </div>
                        <div
                          id="add-output-val"
                          className="text-cyan-400 font-bold text-sm mt-0.5"
                        >
                          {result.addOutput}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-sans">
                        Full Command Execution:
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        $ {result.command}
                      </div>
                      <pre className="text-zinc-200 text-xs whitespace-pre-wrap bg-zinc-900/70 p-2 rounded border border-zinc-800/80">
                        {result.stdout}
                      </pre>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-zinc-500 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Node.js execution latency: {result.durationMs}ms</span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-500 italic py-3">
                    Click &quot;Run in Node.js&quot; to execute the script in the server runtime.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              CLI command: <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">node variables-functions.js</code>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            npm run run:vars
          </div>
        </div>
      </div>
    </div>
  );
}
