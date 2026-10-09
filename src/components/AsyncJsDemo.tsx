import React, { useState } from "react";
import {
  Timer,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  Layers,
  Sparkles,
  Clock,
  ArrowRight,
  GitBranch,
} from "lucide-react";

const CODE_SNIPPET = `// 1. Callbacks (traditional)
function fetchData(callback) {
  setTimeout(() => {
    callback('Data received!');
  }, 1000);
}

// 2. Promises (ES6+)
const fetchDataPromise = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve('Promise resolved!'), 1000);
  });
};

// 3. Async/Await (ES8+)
async function getData() {
  const result = await fetchDataPromise();
  console.log(result);
}

getData(); // Call the async function`;

export function AsyncJsDemo() {
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(3);
  const [result, setResult] = useState<{
    stdout: string;
    command: string;
    durationMs: number;
  } | null>({
    command: "node async-demo.js",
    stdout:
      "1. Starting callback demonstration...\n2. Awaiting promise using async/await...\nCallback output: Data received!\nAsync/Await output: Promise resolved!\n3. All asynchronous tasks completed.\n",
    durationMs: 218,
  });
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeAsync = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/run-async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Async execution failed");
      }
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Execution error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      id="async-js-card"
      className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Asynchronous JavaScript in Node.js
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                Callbacks • Promises • Async/Await
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              The evolution of non-blocking asynchronous programming on Node.js single-threaded event loop
            </p>
          </div>
        </div>

        <button
          id="copy-async-code-btn"
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

      {/* Main Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Code Preview & Paradigm Comparison */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>async-demo.js</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">ES8+ Async/Await</span>
            </div>

            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-4 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="text-amber-300/95">
                <code>{CODE_SNIPPET}</code>
              </pre>
            </div>

            {/* Evolution Paradigms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px] text-zinc-700">
                  1. Callbacks (Pre-ES6)
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Passed as function arguments. Vulnerable to &quot;callback hell&quot; with deeply nested logic.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px] text-zinc-700">
                  2. Promises (ES6)
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Represent future values with states (<code className="font-mono text-zinc-800">pending</code>, <code className="font-mono text-zinc-800">resolved</code>, <code className="font-mono text-zinc-800">rejected</code>) &amp; <code className="font-mono text-zinc-800">.then()</code>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px] text-zinc-700">
                  3. Async / Await (ES8)
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Syntactic sugar over Promises allowing synchronous-looking syntax and native <code className="font-mono text-zinc-800">try/catch</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Execution & Timeline */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Live Event Loop Execution</span>
              </span>
              <button
                id="run-async-btn"
                type="button"
                onClick={executeAsync}
                disabled={running}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{running ? "Awaiting Loop..." : "Run in Node.js"}</span>
              </button>
            </div>

            {/* Event Loop Flow Diagram */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Node.js Event Loop Flow:
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-white border border-zinc-200 text-zinc-700 font-mono text-[11px]">
                  Call Stack
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px]">
                  libuv Async APIs (setTimeout)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[11px]">
                  Microtasks (Promise)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]">
                  Output Result
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Terminal Result */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
              <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Node.js Process Output</span>
                </div>
                {result && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-3">
                {result ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-sans">
                        Process Command:
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        $ {result.command}
                      </div>
                      <pre className="text-zinc-200 text-xs whitespace-pre-wrap bg-zinc-900/70 p-2.5 rounded border border-zinc-800/80 leading-relaxed">
                        {result.stdout}
                      </pre>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-zinc-500 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Roundtrip runtime: {result.durationMs}ms</span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-500 italic py-3">
                    Click &quot;Run in Node.js&quot; to execute async flows.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              CLI command: <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">node async-demo.js</code>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            npm run run:async
          </div>
        </div>
      </div>
    </div>
  );
}
