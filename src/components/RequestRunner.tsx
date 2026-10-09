import React, { useState } from "react";
import { Play, RotateCcw, Copy, Check, Terminal, Sparkles, AlertCircle, Clock, Zap } from "lucide-react";
import type { GeminiRunResult } from "../types";

interface RequestRunnerProps {
  apiKeyConfigured: boolean;
}

const DEFAULT_PROMPT = "Hello! Tell me a quick joke about Node.js.";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export function RequestRunner({ apiKeyConfigured }: RequestRunnerProps) {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GeminiRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/run-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong while connecting to Gemini API");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setModel(DEFAULT_MODEL);
    setError(null);
  };

  return (
    <div id="request-runner-card" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Run Your First Request</h2>
            <p className="text-xs text-zinc-500">Executes SDK <code className="font-mono text-zinc-700 bg-zinc-200/60 px-1 py-0.5 rounded">ai.models.generateContent</code></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="model-select" className="text-xs text-zinc-500 font-medium">Model:</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-xs font-mono bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast &amp; Reliable)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (General Reasoning)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (Flash Alias)</option>
          </select>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="prompt-input" className="text-xs font-semibold text-zinc-700">
              Prompt (<code className="font-mono text-zinc-500">contents</code>)
            </label>
            {prompt !== DEFAULT_PROMPT && (
              <button
                id="reset-prompt-btn"
                type="button"
                onClick={handleReset}
                className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to default</span>
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              id="prompt-input"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full text-sm font-mono rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-zinc-500">
            Click to run <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">main()</code> with your prompt
          </div>
          <button
            id="run-request-btn"
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={handleRun}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Generating Joke...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                <span>Run Request</span>
              </>
            )}
          </button>
        </div>

        {/* API Key Warning if missing */}
        {!apiKeyConfigured && (
          <div id="missing-key-banner" className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Gemini API Key Required: </span>
              Configure your API key in AI Studio's <strong>Settings &gt; Secrets</strong> panel (or in your <code className="font-mono text-amber-800 bg-amber-100 px-1 py-0.5 rounded">.env</code> file as <code className="font-mono text-amber-800 bg-amber-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code>).
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div id="error-alert" className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Execution Failed</p>
              <p className="font-mono text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Terminal output simulation */}
        <div id="terminal-container" className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
          <div className="bg-zinc-900 px-3.5 py-2 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium tracking-wide">Terminal Output (stdout)</span>
            </div>
            {result?.text && (
              <button
                id="copy-output-btn"
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="p-4 space-y-3 min-h-[140px] text-zinc-300">
            <div className="flex items-center space-x-2 text-zinc-500 select-none">
              <span className="text-emerald-400">$</span>
              <span>node index.js</span>
            </div>

            {loading && (
              <div className="flex items-center space-x-2 text-zinc-400 py-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-zinc-400">Calling Gemini 2.5 Flash API...</span>
              </div>
            )}

            {!loading && !result && !error && (
              <div className="text-zinc-500 italic py-3">
                Click "Run Request" above to execute the Node.js quickstart script and see Gemini's live response.
              </div>
            )}

            {!loading && result && (
              <div className="space-y-3">
                <div id="gemini-text-output" className="text-zinc-100 text-sm whitespace-pre-wrap leading-relaxed bg-zinc-900/60 p-3 rounded border border-zinc-800/80">
                  {result.text}
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-zinc-500 border-t border-zinc-900">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{result.durationMs}ms</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Model:</span>
                    <span className="text-zinc-300">{result.model}</span>
                  </div>
                  {result.usageMetadata && (
                    <div className="flex items-center space-x-1">
                      <span>Tokens:</span>
                      <span className="text-zinc-300">
                        {result.usageMetadata.promptTokenCount ?? 0} prompt / {result.usageMetadata.candidatesTokenCount ?? 0} response
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
