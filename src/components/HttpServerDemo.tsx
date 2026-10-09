import React, { useState } from "react";
import { Play, Copy, Check, Server, Globe, ArrowRight, CheckCircle2, Clock, Code2, ExternalLink } from "lucide-react";
import type { HttpServerTestResult } from "../types";

const HTTP_SNIPPET = `const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!');
}).listen(8080);`;

interface HttpServerDemoProps {
  server8080Active?: boolean;
}

export function HttpServerDemo({ server8080Active = true }: HttpServerDemoProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<HttpServerTestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testServer = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch("/api/test-http-8080");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reach Node.js HTTP server");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to query port 8080");
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(HTTP_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="http-server-card" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">Node.js HTTP Server</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Port 8080
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Built-in <code className="font-mono text-zinc-700 bg-zinc-200/60 px-1 py-0.5 rounded">http</code> module Hello World server
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="copy-http-code-btn"
            type="button"
            onClick={handleCopy}
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs"
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

          <a
            id="open-raw-http-demo-link"
            href="/api/http-demo"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs"
            title="Open raw plain-text HTTP response in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Raw Endpoint</span>
          </a>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Code Snippet */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700 flex items-center space-x-1.5">
                <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>hello-http.cjs</span>
              </span>
              <span className="text-[11px] text-zinc-400">Node.js CommonJS</span>
            </div>

            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-3.5 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="text-emerald-300/90">
                <code>{HTTP_SNIPPET}</code>
              </pre>
            </div>

            {/* Explanatory bullets */}
            <div className="pt-2 text-xs text-zinc-600 space-y-1.5 bg-zinc-50/70 p-3 rounded-lg border border-zinc-200/80">
              <div className="font-semibold text-zinc-800 text-[11px] uppercase tracking-wider">How it works:</div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-zinc-600">
                <li><code className="font-mono text-zinc-800">require('http')</code>: Node&apos;s standard library HTTP module.</li>
                <li><code className="font-mono text-zinc-800">res.writeHead(200, ...)</code>: Sets status code &amp; MIME type header.</li>
                <li><code className="font-mono text-zinc-800">res.end(&apos;Hello World!&apos;)</code>: Sends response body &amp; closes stream.</li>
                <li><code className="font-mono text-zinc-800">.listen(8080)</code>: Binds TCP port 8080 for incoming connections.</li>
              </ul>
            </div>
          </div>

          {/* Right: Live Request Tester */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>Live HTTP Request &amp; Response</span>
              </span>
              <button
                id="test-http-btn"
                type="button"
                onClick={testServer}
                disabled={testing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>{testing ? "Requesting..." : "Send GET Request"}</span>
              </button>
            </div>

            {/* Request Display */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">GET</span>
                <span className="text-zinc-800">http://localhost:8080/</span>
              </div>
              <span className="text-[11px] text-zinc-400">HTTP/1.1</span>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Live Response Box */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
              <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                <span>HTTP Response</span>
                {result && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{result.statusCode} {result.statusMessage || "OK"}</span>
                  </span>
                )}
              </div>

              <div className="p-3 space-y-2.5 min-h-[120px]">
                {testing && (
                  <div className="flex items-center space-x-2 text-zinc-400 py-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Connecting to http://localhost:8080...</span>
                  </div>
                )}

                {!testing && !result && (
                  <div className="text-zinc-500 italic py-4">
                    Click &quot;Send GET Request&quot; to test the live Node.js HTTP server running on port 8080.
                  </div>
                )}

                {!testing && result && (
                  <div className="space-y-2">
                    <div className="text-zinc-400 text-[11px] space-y-0.5 border-b border-zinc-800/80 pb-2">
                      <div><span className="text-zinc-500">status:</span> <span className="text-emerald-400">{result.statusCode} OK</span></div>
                      <div><span className="text-zinc-500">content-type:</span> <span className="text-zinc-300">{result.headers?.["content-type"] || "text/plain"}</span></div>
                      <div><span className="text-zinc-500">connection:</span> <span className="text-zinc-300">{result.headers?.connection || "close"}</span></div>
                    </div>

                    <div className="pt-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Response Body:</div>
                      <div id="http-response-body" className="p-2.5 rounded bg-zinc-900 text-emerald-400 font-bold text-sm border border-zinc-800">
                        {result.body}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-zinc-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Roundtrip latency: {result.latencyMs}ms</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CLI Instruction Footer */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Standalone script available: <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">node hello-http.cjs</code>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            npm run run:http
          </div>
        </div>
      </div>
    </div>
  );
}
