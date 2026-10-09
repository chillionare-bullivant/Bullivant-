import React, { useState } from "react";
import { Code2, Play, Loader2, CheckCircle2, FileJson, Layers, Sparkles } from "lucide-react";
import type { StructuredTopicResult } from "../types";

interface Props {
  apiKeyConfigured: boolean;
}

export function GeminiStructuredDemo({ apiKeyConfigured }: Props) {
  const [prompt, setPrompt] = useState("Analyze the architecture of Node.js and its single-threaded event loop.");
  const [model, setModel] = useState("gemini-3.1-flash-lite");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredTopicResult | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "json">("cards");

  const runStructuredQuery = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Structured output failed");
      }

      setResult(data.data);
      setRawJson(data.rawText);
      setDurationMs(data.durationMs);
    } catch (err: any) {
      setError(err?.message || "Failed to generate structured JSON.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="gemini-structured-container" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
            <FileJson className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Structured JSON Schema Output</h3>
            <p className="text-xs text-zinc-500">
              <code>responseMimeType: &quot;application/json&quot;</code> with verified schema
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-mono text-zinc-400">View:</span>
          <div className="flex bg-zinc-200/70 p-0.5 rounded-md text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2 py-0.5 rounded ${viewMode === "cards" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"}`}
            >
              Card View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("json")}
              className={`px-2 py-0.5 rounded ${viewMode === "json" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"}`}
            >
              Raw JSON
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label htmlFor="structured-topic-input" className="block text-xs font-medium text-zinc-700 mb-1">
            Prompt / Topic for Schema Analysis
          </label>
          <div className="flex gap-2">
            <input
              id="structured-topic-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <button
              id="run-structured-btn"
              type="button"
              onClick={runStructuredQuery}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enforcing Schema...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {durationMs !== null && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Guaranteed JSON parsed in {durationMs}ms</span>
            <span className="text-zinc-300">|</span>
            <span>CLI equivalent: <code>node structured.js</code></span>
          </div>
        )}

        {result ? (
          viewMode === "cards" ? (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-900">{result.topic || "Analysis Output"}</h4>
                  {typeof result.ratingOutOfTen === "number" && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-200/80 text-amber-900">
                      Score: {result.ratingOutOfTen}/10
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-700 leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2">
                  <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Key Concepts</span>
                  </span>
                  <ul className="space-y-1.5">
                    {result.keyConcepts?.map((item, idx) => (
                      <li key={idx} className="text-xs text-zinc-600 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2">
                  <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Architectural Recommendations</span>
                  </span>
                  <ul className="space-y-1.5">
                    {result.recommendations?.map((item, idx) => (
                      <li key={idx} className="text-xs text-zinc-600 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <pre className="p-4 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800">
              {rawJson}
            </pre>
          )
        ) : (
          <div className="p-6 text-center text-zinc-400 text-xs bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            Click &quot;Generate JSON&quot; to test the Type.OBJECT and Type.ARRAY schema enforcement in Node.js.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
