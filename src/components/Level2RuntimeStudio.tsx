import React, { useState, useEffect } from "react";
import {
  Terminal,
  Bug,
  Cpu,
  Layers,
  Play,
  FileCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Radio,
  FolderTree,
  Sliders,
  Sparkles,
  ArrowRight,
  Code2,
  Box,
  Eye,
  RefreshCw,
  GitBranch,
  Shield,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
} from "lucide-react";

interface AstBlock {
  id: string;
  language: string;
  code: string;
  lineEstimate: number;
  isValidSyntax?: boolean;
  syntaxError?: string | null;
}

// Client-side syntax validation layer
function validateCodeSyntax(code: string, language: string): { isValid: boolean; error: string | null } {
  const lang = (language || "").toLowerCase().trim();

  // JavaScript / Node.js Syntax Validation
  if (lang === "javascript" || lang === "js" || lang === "node") {
    try {
      // Use Function constructor to validate syntactic structure without executing
      new Function(code);
      return { isValid: true, error: null };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }

  // JSON Syntax Validation
  if (lang === "json") {
    try {
      JSON.parse(code);
      return { isValid: true, error: null };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }

  // Shell / Bash Syntax Validation (balancing quotes and delimiters)
  if (lang === "bash" || lang === "sh" || lang === "shell") {
    const doubleQuotes = (code.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      return { isValid: false, error: 'Syntax Error: Unmatched double quote (") in shell script' };
    }
    const singleQuotes = (code.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return { isValid: false, error: "Syntax Error: Unmatched single quote (') in shell script" };
    }
    const backticks = (code.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      return { isValid: false, error: "Syntax Error: Unmatched backtick (`) in shell script" };
    }
    return { isValid: true, error: null };
  }

  return { isValid: true, error: null };
}

interface FileDescriptor {
  path: string;
  name: string;
  category: string;
  content: string;
  sizeBytes: number;
  exists: boolean;
}

interface SseLogItem {
  type: string;
  data: string;
  timestamp: number;
  stack?: string[];
  conditionEvaluated?: {
    expression: string;
    matched: boolean;
  };
}

export function Level2RuntimeStudio() {
  const [activeTab, setActiveTab] = useState<"runner" | "guide" | "files" | "callstack">("runner");
  const [blocks, setBlocks] = useState<AstBlock[]>([]);
  const [files, setFiles] = useState<FileDescriptor[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("server.js");
  const [loading, setLoading] = useState<boolean>(true);
  const [runningBlockId, setRunningBlockId] = useState<string | null>(null);
  const [activeLogs, setActiveLogs] = useState<Record<string, SseLogItem[]>>({});
  const [conditionExpr, setConditionExpr] = useState<string>("language === 'javascript'");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [highlightedStack, setHighlightedStack] = useState<string[] | null>(null);

  // Step 1: The Map live state
  const [step1MapData, setStep1MapData] = useState<any>(null);
  const [step1Open, setStep1Open] = useState<boolean>(false);
  const [step1Loading, setStep1Loading] = useState<boolean>(false);

  // Step 2: The Skeleton live state
  const [step2TreeData, setStep2TreeData] = useState<any>(null);
  const [step2Open, setStep2Open] = useState<boolean>(false);
  const [step2Loading, setStep2Loading] = useState<boolean>(false);

  // Step 3: Tooling tab
  const [step3Tab, setStep3Tab] = useState<"devcontainer" | "launch">("devcontainer");

  // Step 4 & 5: Trace & Break live state
  const [activeTraceStep, setActiveTraceStep] = useState<number | null>(null);
  const [step4BreakData, setStep4BreakData] = useState<any>(null);
  const [step4Loading, setStep4Loading] = useState<boolean>(false);

  const runStep1Map = async () => {
    if (step1MapData) {
      setStep1Open(!step1Open);
      return;
    }
    setStep1Loading(true);
    setStep1Open(true);
    try {
      const res = await fetch("/api/level2/methodology/map").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setStep1MapData(data);
        }
      }
    } catch (_e) {
      // Handled
    } finally {
      setStep1Loading(false);
    }
  };

  const runStep2Tree = async () => {
    if (step2TreeData) {
      setStep2Open(!step2Open);
      return;
    }
    setStep2Loading(true);
    setStep2Open(true);
    try {
      const res = await fetch("/api/level2/methodology/skeleton").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setStep2TreeData(data);
        }
      }
    } catch (_e) {
      // Handled
    } finally {
      setStep2Loading(false);
    }
  };

  const loadStep4Breaks = async (stepNum: number) => {
    if (activeTraceStep === stepNum) {
      setActiveTraceStep(null);
      return;
    }
    setActiveTraceStep(stepNum);
    if (!step4BreakData) {
      setStep4Loading(true);
      try {
        const res = await fetch("/api/level2/methodology/trace-break").catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.success) {
            setStep4BreakData(data);
          }
        }
      } catch (_e) {
        // Handled
      } finally {
        setStep4Loading(false);
      }
    }
  };

  const downloadJsonConfig = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    load();
  }, []);

  // Validation layer in load function
  const load = async () => {
    setLoading(true);
    try {
      const [blocksRes, filesRes] = await Promise.all([
        fetch("/api/level2/blocks")
          .then((r) => (r.ok ? r.json() : { success: false }))
          .catch(() => ({ success: false })),
        fetch("/api/level2/files")
          .then((r) => (r.ok ? r.json() : { success: false }))
          .catch(() => ({ success: false })),
      ]);

      if (blocksRes.success && blocksRes.blocks) {
        // VALIDATION LAYER: Check if every code block from README is syntactically valid
        const validatedBlocks: AstBlock[] = blocksRes.blocks.map((b: AstBlock) => {
          const validation = validateCodeSyntax(b.code, b.language);
          return {
            ...b,
            isValidSyntax: validation.isValid,
            syntaxError: validation.error,
          };
        });
        setBlocks(validatedBlocks);
      }
      if (filesRes.success && filesRes.files) {
        setFiles(filesRes.files);
      }
    } catch (_err) {
      // Gracefully handled
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocksAndFiles = load;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runBlock = async (block: AstBlock) => {
    // PRE-EXECUTION VALIDATION: Prevent streaming execution if code block has syntax errors
    if (block.isValidSyntax === false) {
      setActiveLogs((prev) => ({
        ...prev,
        [block.id]: [
          {
            type: "stderr",
            data: `[Validation Layer Error] Stream execution aborted: Code block failed syntax validation (${block.syntaxError || "Invalid syntax"}). Execution was blocked before connecting to runtime.`,
            timestamp: Date.now(),
          },
        ],
      }));
      return;
    }

    setRunningBlockId(block.id);
    setActiveLogs((prev) => ({
      ...prev,
      [block.id]: [
        {
          type: "status",
          data: `Connecting SSE stream to /api/level2/execute...`,
          timestamp: Date.now(),
        },
      ],
    }));

    try {
      const response = await fetch("/api/level2/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId: block.id,
          code: block.code,
          language: block.language,
          conditionExpression: conditionExpr,
        }),
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported by browser");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.replace("data:", "").trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.stack && parsed.stack.length > 0) {
                setHighlightedStack(parsed.stack);
              }
              setActiveLogs((prev) => ({
                ...prev,
                [block.id]: [
                  ...(prev[block.id] || []),
                  {
                    type: eventType,
                    data: typeof parsed.data === "object" ? JSON.stringify(parsed.data) : String(parsed.data),
                    timestamp: parsed.timestamp || Date.now(),
                    stack: parsed.stack,
                    conditionEvaluated: parsed.conditionEvaluated,
                  },
                ],
              }));
            } catch {
              setActiveLogs((prev) => ({
                ...prev,
                [block.id]: [
                  ...(prev[block.id] || []),
                  {
                    type: eventType,
                    data: dataStr,
                    timestamp: Date.now(),
                  },
                ],
              }));
            }
          }
        }
      }
    } catch (err: any) {
      setActiveLogs((prev) => ({
        ...prev,
        [block.id]: [
          ...(prev[block.id] || []),
          {
            type: "stderr",
            data: `Stream Error: ${err.message}`,
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setRunningBlockId(null);
    }
  };

  const currentFile = files.find((f) => f.name === selectedFile) || files[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30">
              <Bug className="w-3.5 h-3.5 text-indigo-400" />
              <span>V8 Debug Protocol • 0.0.0.0:9229</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">Level 2 Active Runtime</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Trace Execution, Don't Just Read Files
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Transform static markdown documentation into an active runtime with real-time AST token extraction,
              Server-Sent Events (SSE) streaming execution, live Call Stack inspection, and zero-overhead containerized debugging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchBlocksAndFiles}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh AST</span>
            </button>
            <button
              onClick={() => {
                const combined = files.map((f) => `// ================= ${f.name} =================\n${f.content}\n`).join("\n");
                copyToClipboard(combined, "all-files");
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {copiedKey === "all-files" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>All 7 Files Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Complete Starter Project</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("runner")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "runner"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Markdown AST Runner</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {blocks.length} Blocks
            </span>
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "guide"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>The 5-Step Execution Methodology</span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "files"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Project Files Explorer</span>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              7 Files
            </span>
          </button>

          <button
            onClick={() => setActiveTab("callstack")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "callstack"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white bg-slate-800/40"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Call Stack & Breakpoint Engine</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE RUNNER */}
      {activeTab === "runner" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code Blocks Extracted from README.md */}
          <div className="lg:col-span-7 space-y-4">
            {/* Conditional Breakpoint Control Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-200">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">V8 Conditional Breakpoint Rule</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    server.js line 37
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Expression tested per execution request
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={conditionExpr}
                    onChange={(e) => setConditionExpr(e.target.value)}
                    placeholder="language === 'javascript'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setConditionExpr("language === 'javascript'")}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono rounded-lg transition-colors cursor-pointer"
                >
                  JS Only
                </button>
                <button
                  type="button"
                  onClick={() => setConditionExpr("blockId === 'block-1'")}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono rounded-lg transition-colors cursor-pointer"
                >
                  Block 1 Only
                </button>
              </div>
            </div>

            {/* Syntax Validation Layer Summary & Test Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-200">Pre-Execution Syntax Validation Layer:</span>{" "}
                  <span className="text-emerald-400 font-semibold">Active in load()</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px]">
                  Validated {blocks.filter((b) => b.isValidSyntax).length}/{blocks.length} blocks passed
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBlocks((prev) =>
                      prev.map((b, i) =>
                        i === 0
                          ? b.isValidSyntax === false
                            ? {
                                ...b,
                                code: `const timestamp = new Date().toISOString();\nconsole.log(\`[Level 2 Kernel] Active verification at \${timestamp}\`);\nconsole.log(\`Platform architecture: \${process.platform} (\${process.arch})\`);\nconst sum = [10, 20, 30, 40, 50].reduce((acc, n) => acc + n, 0);\nconsole.log(\`Calculated reduced vector sum = \${sum}\`);\nsum;`,
                                isValidSyntax: true,
                                syntaxError: null,
                              }
                            : {
                                ...b,
                                code: `const timestamp = new Date().toISOString();\nconst sum = [10, 20, 30.reduce(;\n// Deliberate syntax error to test validation layer`,
                                isValidSyntax: false,
                                syntaxError: "Unexpected token ';' (SyntaxError: missing ) after argument list)",
                              }
                          : b
                      )
                    );
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                  title="Simulate a syntax error to test how the validation layer blocks execution"
                >
                  ⚡ Simulate Syntax Error in Block 0
                </button>
              </div>
            </div>

            {/* AST Code Blocks list */}
            {blocks.map((block) => {
              const isRunning = runningBlockId === block.id;
              const logs = activeLogs[block.id] || [];

              return (
                <div
                  key={block.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all"
                >
                  <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {block.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Lang: <b className="text-slate-200">{block.language}</b>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({block.lineEstimate} lines)
                      </span>

                      {/* Syntax Validation Layer Badge */}
                      {block.isValidSyntax ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Syntactically Valid</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1" title={block.syntaxError || "Syntax error"}>
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>Syntax Error</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(block.code, block.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
                        title="Copy code"
                      >
                        {copiedKey === block.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => runBlock(block)}
                        disabled={isRunning || !block.isValidSyntax}
                        title={!block.isValidSyntax ? `Stream blocked: ${block.syntaxError}` : "Run block via SSE stream"}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          !block.isValidSyntax
                            ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                            : isRunning
                            ? "bg-indigo-800 text-indigo-200 opacity-80"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                        }`}
                      >
                        <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                        <span>
                          {!block.isValidSyntax
                            ? "Blocked (Syntax Error)"
                            : isRunning
                            ? "Streaming..."
                            : "Run (SSE Stream)"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Syntax Validation Error Alert (if invalid) */}
                  {!block.isValidSyntax && (
                    <div className="px-4 py-2.5 bg-rose-950/70 border-b border-rose-800/80 text-rose-200 text-xs font-mono flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-300">Validation Layer Blocked Execution:</strong>{" "}
                        <span>{block.syntaxError || "Syntax error detected in README code block."}</span>
                        <div className="text-[10px] text-rose-400/80 mt-0.5">Execution streaming is prevented to protect the runtime.</div>
                      </div>
                    </div>
                  )}

                  {/* Code Snippet Box */}
                  <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border-b border-slate-800/80">
                    <pre className="leading-relaxed whitespace-pre-wrap">{block.code}</pre>
                  </div>

                  {/* Live Execution Logs & Breakpoint Display */}
                  {logs.length > 0 && (
                    <div className="p-4 bg-black/60 font-mono text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-800">
                        <span className="flex items-center space-x-1">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>Server-Sent Events (SSE) Stream Active</span>
                        </span>
                        <span>{logs.length} events received</span>
                      </div>

                      {logs.map((log, idx) => {
                        const isBreakpointHit = log.type === "breakpoint_hit";
                        const isBreakpointSkipped = log.type === "breakpoint_skipped";
                        const isError = log.type === "stderr";
                        const isStdout = log.type === "stdout";

                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded flex items-start space-x-2 ${
                              isBreakpointHit
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold"
                                : isBreakpointSkipped
                                ? "bg-slate-900/80 text-slate-400 font-mono"
                                : isError
                                ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                                : isStdout
                                ? "text-emerald-300"
                                : "text-sky-300"
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 select-none">&gt;</span>
                            <div className="flex-1 break-all">
                              <span>{log.data}</span>
                              {log.stack && log.stack.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Top frame: <span className="text-indigo-400">{log.stack[0]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Call Stack & Container Debug Socket */}
          <div className="lg:col-span-5 space-y-4">
            {/* Real-time Call Stack Viewer */}
            <div className="bg-slate-900 border border-indigo-700/40 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  <span>V8 Call Stack Inspector</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                  Runtime Frames
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When execution passes through the route handler, the exact call stack frames are dynamically captured and pushed to the client:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] space-y-2">
                {(highlightedStack || [
                  "parseReadmeCodeBlocks (server.js:23:18)",
                  "app.post('/api/readme/execute') (server.js:37:3)",
                  "Layer.handle [as handle_request] (express/lib/router/layer.js:95:5)",
                  "Route.dispatch (express/lib/router/route.js:114:3)",
                ]).map((frame, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-1.5 rounded bg-slate-900/70 border border-slate-800/80 text-slate-300"
                  >
                    <span className="text-[10px] bg-slate-800 text-indigo-300 px-1 rounded font-mono">
                      #{index}
                    </span>
                    <span className="font-semibold text-indigo-200">{frame}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Containerized Debug Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <Box className="w-4 h-4 text-emerald-400" />
                <span>Containerized Debug Port</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">HTTP Service</span>
                  <span className="text-emerald-400 font-bold">0.0.0.0:3001</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Debug Inspector</span>
                  <span className="text-indigo-400 font-bold">0.0.0.0:9229</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                By pairing <code>0.0.0.0:9229</code> in <code>devcontainer.json</code> with <code>launch.json</code>,
                local and remote paths share the exact same root, completely eliminating the common <code>localRoot vs remoteRoot</code> mapping errors.
              </p>
            </div>

            {/* Level 1 vs Level 2 Contrast Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                The Mental Shift: Level 1 &rarr; Level 2
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                  <span className="text-rose-400 font-bold font-mono">Level 1:</span> Ctrl+F searching strings across dozens of files, guessing which function runs first.
                </div>
                <div className="p-2 rounded bg-indigo-950/60 border border-indigo-700/40 text-slate-200">
                  <span className="text-emerald-400 font-bold font-mono">Level 2:</span> Setting a Conditional Breakpoint, following the Call Stack, and tracing the exact execution path with live SSE telemetry.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THE 5-STEP METHODOLOGY GUIDE */}
      {activeTab === "guide" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: The Map */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">1</span>
                    <span>The Map - 2 Minutes</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('cat package.json | grep -E "scripts|dependencies|workspaces|main"', "cat-pkg")}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Copy command"
                    >
                      {copiedKey === "cat-pkg" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={runStep1Map}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>{step1Open ? "Hide Live Output" : "Run Live"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  <code>package.json</code> is your compass. Never open random source files first.
                </p>

                <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800/80">
                  cat package.json | grep -E &quot;scripts|dependencies|workspaces|main&quot;
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><b>scripts.start / dev</b> reveals the real server entry point immediately.</li>
                  <li><b>dependencies</b> discloses architecture (Express, Fastify, Nest, Prisma).</li>
                  <li><b>workspaces</b> signals a monorepo needing explicit Jest/Vite path mapping.</li>
                </ul>
              </div>

              {/* Step 1 Live Execution Drawer */}
              {step1Open && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <strong className="text-slate-200">Live grep output:</strong>
                    </span>
                    <span className="text-[10px] text-slate-500">package.json</span>
                  </div>

                  {step1Loading ? (
                    <div className="p-3 bg-black/60 rounded text-slate-400 animate-pulse text-xs">Analyzing package.json...</div>
                  ) : step1MapData ? (
                    <div className="space-y-2">
                      <pre className="p-3 bg-slate-950 rounded-lg text-emerald-300 text-[10px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                        {step1MapData.rawGrepOutput}
                      </pre>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block font-bold">Entry Point:</span>
                          <span className="text-emerald-400">{step1MapData.entryPoint}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 block font-bold">Total Dependencies:</span>
                          <span className="text-indigo-400">{step1MapData.dependencies?.length || 0} packages</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Step 2: The Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">2</span>
                    <span>The Skeleton - 3 Minutes</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard("tree -L 2 -I 'node_modules,dist,.git'", "tree-cmd")}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Copy command"
                    >
                      {copiedKey === "tree-cmd" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={runStep2Tree}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <FolderTree className="w-3 h-3 text-indigo-400" />
                      <span>{step2Open ? "Hide Skeleton" : "Run Live"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Find where real work happens without getting lost in boilerplate directories:
                </p>

                <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800/80">
                  tree -L 2 -I &apos;node_modules,dist,.git&apos;
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Identify <code>server.ts / server.js</code> entry files.</li>
                  <li>Inspect <code>.env.example</code> to know what external infrastructure is required.</li>
                  <li>Check <code>docker-compose.yml</code> before running <code>npm install</code>.</li>
                </ul>
              </div>

              {/* Step 2 Live Skeleton Drawer */}
              {step2Open && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <strong className="text-slate-200">Live Project Skeleton:</strong>
                    </span>
                    <span className="text-[10px] text-slate-500">Excluding node_modules</span>
                  </div>

                  {step2Loading ? (
                    <div className="p-3 bg-black/60 rounded text-slate-400 animate-pulse text-xs">Generating tree...</div>
                  ) : step2TreeData ? (
                    <pre className="p-3 bg-slate-950 rounded-lg text-indigo-300 text-[10px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                      {step2TreeData.rawTree}
                    </pre>
                  ) : null}
                </div>
              )}
            </div>

            {/* Step 3: Tooling Fixes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">3</span>
                    <span>Fix Tooling Once (Monorepo &amp; Paths)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const content = `// .devcontainer/devcontainer.json\n"forwardPorts": [3000, 3001, 8545, 8546, 8332, 9229]\n// .vscode/launch.json\n"port": 9229, "address": "localhost"`;
                        copyToClipboard(content, "tooling-cfg");
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Copy config"
                    >
                      {copiedKey === "tooling-cfg" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const devcontainer = {
                          name: "Node.js Gemini Blockchain Runtime",
                          forwardPorts: [3000, 3001, 8545, 8546, 8332, 7777, 9229]
                        };
                        downloadJsonConfig("devcontainer.json", JSON.stringify(devcontainer, null, 2));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Download className="w-3 h-3 text-amber-400" />
                      <span>Download Configs</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Avoid path mapping drift between your host and containerized process:
                </p>

                <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto space-y-1 border border-slate-800/80">
                  <div className="text-indigo-400">// .devcontainer/devcontainer.json</div>
                  <div>&quot;forwardPorts&quot;: [3001, 9229]</div>
                  <div className="text-indigo-400">// .vscode/launch.json</div>
                  <div>&quot;port&quot;: 9229, &quot;address&quot;: &quot;localhost&quot;</div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-slate-500">Configured Ports:</span>
                <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">9229 (V8)</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">8545 (EVM)</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">8332 (BTC)</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">3000 (Web)</span>
                </div>
              </div>
            </div>

            {/* Step 4 & 5: Trace & The 3 Questions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">4 &amp; 5</span>
                  <span>Trace, Don&apos;t Read &amp; The 3 Questions</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Trace a single request from the edge to the database using the 3 core questions:
                </p>

                {/* 3 Clickable Question Blocks */}
                <div className="space-y-2 text-xs font-mono">
                  {/* Question 1 */}
                  <div
                    onClick={() => loadStep4Breaks(1)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      activeTraceStep === 1
                        ? "bg-emerald-950/40 border-emerald-500/50 shadow-sm"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">1. How does it start?</span>
                      <span className="text-[10px] text-slate-500">{activeTraceStep === 1 ? "▲ Collapse" : "▼ Trace"}</span>
                    </div>
                    <code className="text-slate-300 text-[11px]">package.json &rarr; dev &rarr; server.ts</code>

                    {activeTraceStep === 1 && (
                      <div className="pt-2 border-t border-emerald-800/40 text-[11px] text-emerald-200/90 font-sans space-y-1">
                        <div>1. <code>package.json</code> specifies <code>&quot;dev&quot;: &quot;tsx server.ts&quot;</code>.</div>
                        <div>2. <code>server.ts</code> mounts HTTP port 3000, EVM RPC 8545, EVM WS 8546, Bitcoin Core 8332, Reality Bridge 7777, and V8 Inspector 9229.</div>
                        <div>3. Client UI initializes via React 19 at <code>/src/main.tsx</code>.</div>
                      </div>
                    )}
                  </div>

                  {/* Question 2 */}
                  <div
                    onClick={() => loadStep4Breaks(2)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      activeTraceStep === 2
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-sm"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">2. How does data flow?</span>
                      <span className="text-[10px] text-slate-500">{activeTraceStep === 2 ? "▲ Collapse" : "▼ Trace"}</span>
                    </div>
                    <code className="text-slate-300 text-[11px]">Route &rarr; Controller &rarr; Engine &rarr; VM Sandbox</code>

                    {activeTraceStep === 2 && (
                      <div className="pt-2 border-t border-indigo-800/40 text-[11px] text-indigo-200/90 font-sans space-y-1">
                        <div>1. <b>Route:</b> Inbound request hits Express route (e.g. <code>POST /api/level2/execute</code> or <code>/api/arbitrage/execute</code>).</div>
                        <div>2. <b>Controller:</b> Request body validated with syntax guard and condition predicate.</div>
                        <div>3. <b>Engine:</b> Dispatched to background execution kernel or DEX scanner.</div>
                        <div>4. <b>VM Sandbox:</b> Isolated V8 context runs code with timeout &amp; gas limit protection.</div>
                      </div>
                    )}
                  </div>

                  {/* Question 3 */}
                  <div
                    onClick={() => loadStep4Breaks(3)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      activeTraceStep === 3
                        ? "bg-rose-950/40 border-rose-500/50 shadow-sm"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-bold">3. Where does it break?</span>
                      <span className="text-[10px] text-slate-500">{activeTraceStep === 3 ? "▲ Collapse" : "▼ Trace"}</span>
                    </div>
                    <code className="text-slate-300 text-[11px]">grep -r &quot;throw new|TODO&quot;</code>

                    {activeTraceStep === 3 && (
                      <div className="pt-2 border-t border-rose-800/40 text-[11px] text-rose-200 font-sans space-y-1.5">
                        <div className="font-semibold text-rose-300 text-[10px] uppercase tracking-wide">Live Invariant Fail-Fast Locations:</div>
                        {step4BreakData?.exceptions?.map((exc: any, i: number) => (
                          <div key={i} className="p-1.5 rounded bg-black/60 font-mono text-[10px] text-slate-300 flex items-start space-x-1.5">
                            <span className="text-rose-400 font-bold shrink-0">{exc.file}:</span>
                            <span className="text-slate-400">{exc.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT FILES EXPLORER */}
      {activeTab === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-slate-400 px-1 mb-2">
              All 7 Project Files in <code>level2-active-runtime/</code>:
            </div>
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedFile === file.name
                    ? "bg-indigo-950/70 border-indigo-500 text-white shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-mono font-bold">{file.name}</div>
                    <div className="text-[10px] text-slate-500">{file.category}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {(file.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </button>
            ))}
          </div>

          {/* File Content Preview */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-200">
                  {currentFile?.path}
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {currentFile?.category}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(currentFile?.content || "", currentFile?.name || "")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {copiedKey === currentFile?.name ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
              <pre className="leading-relaxed">{currentFile?.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CALL STACK & BREAKPOINT ENGINE */}
      {activeTab === "callstack" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              How Conditional Breakpoints & Call Stacks Work Under the Hood
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              When debugging large microservices or multi-stage pipelines, ordinary breakpoints pause the program on every single iteration,
              creating fatigue. <b>Conditional Breakpoints</b> instruct V8 to evaluate an inline predicate inside the execution frame.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 font-mono">1. AST Parsing</span>
                <p className="text-xs text-slate-400">
                  <code>marked.lexer(md)</code> decomposes the Markdown file into structural tokens without executing arbitrary code.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 font-mono">2. Predicate Filter</span>
                <p className="text-xs text-slate-400">
                  At line 37 in <code>server.js</code>, the expression <code>language === 'javascript'</code> only triggers when the language matches.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 font-mono">3. Frame Capture</span>
                <p className="text-xs text-slate-400">
                  <code>new Error().stack</code> extracts live V8 stack frames, transmitting them in real-time over the SSE stream.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
