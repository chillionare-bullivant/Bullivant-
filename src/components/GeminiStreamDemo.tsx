import React, { useState } from "react";
import { Play, Loader2, Sparkles, Terminal, ArrowRight, Zap, RefreshCw } from "lucide-react";

interface Props {
  apiKeyConfigured: boolean;
}

export function GeminiStreamDemo({ apiKeyConfigured }: Props) {
  const [prompt, setPrompt] = useState(
    "Explain how Node.js streams work together with the Gemini API to produce responsive real-time outputs in 3 concise bullet points."
  );
  const [model, setModel] = useState("gemini-3.1-flash-lite");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = async () => {
    if (streaming) return;
    setStreaming(true);
    setStreamedText("");
    setChunkCount(0);
    setError(null);
    const start = Date.now();
    setStartTime(start);
    setElapsedMs(null);

    try {
      const res = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error("No response body received for streaming.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let count = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.replace("data: ", "");
            try {
              const data = JSON.parse(jsonStr);
              if (data.done) {
                // finished
              } else if (data.text) {
                count++;
                setChunkCount(count);
                setStreamedText((prev) => prev + data.text);
              } else if (data.error) {
                setError(data.error);
              }
            } catch (e) {
              console.warn("Parse SSE chunk error", e);
            }
          }
        }
      }
      setElapsedMs(Date.now() - start);
    } catch (err: any) {
      setError(err?.message || "Streaming request failed");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div id="gemini-stream-container" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Real-time Streaming in Node.js</h3>
            <p className="text-xs text-zinc-500">
              <code>ai.models.generateContentStream()</code> with async iteration
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-mono text-zinc-500">model:</span>
          <select
            id="stream-model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={streaming}
            className="text-xs font-mono bg-white border border-zinc-300 rounded px-2 py-1 text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast &amp; Reliable)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (Alias)</option>
          </select>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label htmlFor="stream-prompt-input" className="block text-xs font-medium text-zinc-700 mb-1">
            Prompt for Streaming Generation
          </label>
          <div className="flex gap-2">
            <input
              id="stream-prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={streaming}
              placeholder="Enter a prompt to stream..."
              className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              id="start-stream-btn"
              type="button"
              onClick={startStream}
              disabled={streaming || !prompt.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                streaming
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              {streaming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Streaming...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Stream Tokens</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Streaming Diagnostics */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/70">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-400">Status:</span>
            <span className={streaming ? "text-emerald-600 font-semibold flex items-center gap-1" : "text-zinc-700"}>
              {streaming && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
              {streaming ? "Receiving Chunks" : streamedText ? "Completed" : "Idle"}
            </span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-400">Chunks:</span>
            <span className="font-semibold text-zinc-800">{chunkCount}</span>
          </div>
          {elapsedMs !== null && (
            <>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-zinc-400">Duration:</span>
                <span className="font-semibold text-zinc-800">{elapsedMs}ms</span>
              </div>
            </>
          )}
          <div className="ml-auto text-[11px] text-zinc-400 font-mono">
            CLI Script: <code>node stream.js</code>
          </div>
        </div>

        {/* Live Terminal Stream Display */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Streaming Terminal Output (stdout)</span>
            </span>
            {streamedText && (
              <button
                type="button"
                onClick={() => setStreamedText("")}
                className="hover:text-zinc-800 text-zinc-400 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div
            id="stream-output-box"
            className="p-4 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs leading-relaxed min-h-[140px] max-h-[280px] overflow-y-auto whitespace-pre-wrap border border-zinc-800 shadow-inner"
          >
            {streamedText ? (
              <>
                {streamedText}
                {streaming && <span className="inline-block w-2 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />}
              </>
            ) : streaming ? (
              <span className="text-zinc-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Connecting to Gemini stream endpoint...
              </span>
            ) : (
              <span className="text-zinc-500">
                Click &quot;Stream Tokens&quot; to inspect tokens streaming from the Node.js backend.
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <span className="font-semibold">Stream Error:</span> {error}
          </div>
        )}
      </div>
    </div>
  );
}
