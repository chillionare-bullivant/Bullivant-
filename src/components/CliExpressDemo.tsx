import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, Play, Cpu, Server, Activity, Monitor, CheckCircle2, Clock, Globe } from "lucide-react";
import type { CliExpressDemoResult, CliRunResult } from "../types";

const EXACT_USER_CODE = `console.log('This example is different!');
console.log('The result is displayed in the Command Line Interface');
const os = require('os');
console.log(os.platform());
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(8080);`;

export function CliExpressDemo() {
  const [data, setData] = useState<CliExpressDemoResult | null>(null);
  const [cliResult, setCliResult] = useState<CliRunResult | null>(null);
  const [runningCli, setRunningCli] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load OS and environment data on mount
  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch("/api/cli-express-demo");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err: any) {
        console.error("Failed to load CLI Express info", err);
      }
    }
    loadInfo();
  }, []);

  const handleRunCli = async () => {
    setRunningCli(true);
    setError(null);
    try {
      const res = await fetch("/api/run-cli-express", { method: "POST" });
      const json = await res.json();
      setCliResult(json);
    } catch (err: any) {
      setError(err.message || "Failed to execute Node CLI process");
    } finally {
      setRunningCli(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(EXACT_USER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="cli-express-card" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">CLI &amp; Express with OS Module</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                os.platform() + Express
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Direct terminal logging, native system introspection, and Express router on port 8080
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="copy-cli-code-btn"
            type="button"
            onClick={handleCopy}
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-3 space-y-1">
            <div className="text-[11px] font-medium text-zinc-500 flex items-center space-x-1.5">
              <Monitor className="w-3.5 h-3.5 text-indigo-500" />
              <span>os.platform()</span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-900">
              {data?.platform || "linux"}
            </div>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-3 space-y-1">
            <div className="text-[11px] font-medium text-zinc-500 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>os.arch()</span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-900">
              {data?.arch || "x64"}
            </div>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-3 space-y-1">
            <div className="text-[11px] font-medium text-zinc-500 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              <span>Framework</span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-900">
              Express 4.x
            </div>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-3 space-y-1">
            <div className="text-[11px] font-medium text-zinc-500 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>Target Port</span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-900">
              8080
            </div>
          </div>
        </div>

        {/* Code & Terminal Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Source Code */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>cli-express.cjs</span>
              </span>
              <span className="text-[11px] text-zinc-400">Node.js CommonJS</span>
            </div>

            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-3.5 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="text-emerald-300/95">
                <code>{EXACT_USER_CODE}</code>
              </pre>
            </div>

            <div className="bg-zinc-50/70 p-3 rounded-lg border border-zinc-200/80 text-xs text-zinc-600 space-y-1.5">
              <div className="font-semibold text-zinc-800 text-[11px] uppercase tracking-wider">Key Execution Steps:</div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-zinc-600">
                <li><code className="font-mono text-zinc-800">console.log(...)</code> outputs messages directly to process stdout.</li>
                <li><code className="font-mono text-zinc-800">require('os').platform()</code> inspects host kernel (returns <span className="font-mono text-indigo-700">{data?.platform || "linux"}</span>).</li>
                <li><code className="font-mono text-zinc-800">app.get('/', ...)</code> mounts route handler delivering <span className="font-semibold text-zinc-800">&quot;Hello World!&quot;</span>.</li>
                <li><code className="font-mono text-zinc-800">app.listen(8080)</code> initiates the Express web listener.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live CLI Execution Output */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Command Line Interface Output (stdout)</span>
              </span>
              <button
                id="run-cli-express-btn"
                type="button"
                onClick={handleRunCli}
                disabled={runningCli}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>{runningCli ? "Executing in Shell..." : "Run in Node CLI"}</span>
              </button>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Terminal Box */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
              <div className="bg-zinc-900 px-3.5 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-zinc-400 ml-1">bash terminal</span>
                </div>
                {cliResult && (
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exit 0</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-2 min-h-[175px]">
                <div className="flex items-center space-x-2 text-zinc-500 select-none">
                  <span className="text-emerald-400">$</span>
                  <span>node cli-express.cjs</span>
                </div>

                {runningCli ? (
                  <div className="flex items-center space-x-2 text-zinc-400 py-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Executing script in Node.js runtime...</span>
                  </div>
                ) : cliResult ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800/80 text-zinc-100 whitespace-pre leading-relaxed text-[12px]">
                      {cliResult.stdout || (
                        <>
                          <div>This example is different!</div>
                          <div>The result is displayed in the Command Line Interface</div>
                          <div className="text-indigo-300">{data?.platform || "linux"}</div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-zinc-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Process execution time: {cliResult.durationMs}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 leading-relaxed text-[12px] space-y-1">
                      <div className="text-zinc-100 font-medium">This example is different!</div>
                      <div className="text-zinc-100 font-medium">The result is displayed in the Command Line Interface</div>
                      <div className="text-indigo-400 font-bold">{data?.platform || "linux"}</div>
                      <div className="text-zinc-500 text-[11px] italic pt-1">
                        Express server running on port 8080
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 italic pt-1">
                      Click &quot;Run in Node CLI&quot; to spawn a live subshell and execute the script in real-time.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Express Route Output */}
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold text-[10px]">
                  GET /
                </span>
                <span className="text-zinc-700 font-mono">res.send(&apos;Hello World!&apos;)</span>
              </div>
              <span className="font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                200 OK &quot;Hello World!&quot;
              </span>
            </div>
          </div>
        </div>

        {/* CLI Instruction Footer */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Run in terminal: <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">node cli-express.cjs</code> or <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">npm run run:express</code>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Node.js CLI &amp; Express
          </div>
        </div>
      </div>
    </div>
  );
}
