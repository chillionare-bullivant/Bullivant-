import React, { useState, useEffect } from "react";
import {
  FileText,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Save,
  Check,
  Copy,
  ArrowDown,
  Layers,
} from "lucide-react";

const USER_CODE_SNIPPET = `// Load the filesystem module
const fs = require('fs');

// Read file asynchronously
fs.readFile('myfile.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file: ' + err);
    return;
  }
  console.log('File content: ' + data);
});

console.log('Reading file... (this runs first!)');`;

interface FsFileInfo {
  exists: boolean;
  path: string;
  content: string;
  sizeBytes?: number;
  error?: string;
}

export function AsyncFsDemo() {
  const [fileInfo, setFileInfo] = useState<FsFileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState<boolean>(true);
  const [savingFile, setSavingFile] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [running, setRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);
  const [stderr, setStderr] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const loadFile = async () => {
    try {
      setLoadingFile(true);
      const res = await fetch("/api/fs-file");
      const data = await res.json();
      setFileInfo(data);
      if (data.exists) {
        setFileContent(data.content || "");
      }
    } catch (err: any) {
      console.error("Error loading myfile.txt:", err);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    loadFile();
  }, []);

  const saveFile = async () => {
    try {
      setSavingFile(true);
      const res = await fetch("/api/fs-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent }),
      });
      const data = await res.json();
      if (data.success) {
        setFileInfo({
          exists: true,
          path: "myfile.txt",
          content: data.content,
          sizeBytes: data.sizeBytes,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Error saving file:", err);
    } finally {
      setSavingFile(false);
    }
  };

  const runScript = async () => {
    if (running) return;
    setRunning(true);
    setOutput(null);
    setStderr(null);

    try {
      const res = await fetch("/api/fs-run", { method: "POST" });
      const data = await res.json();
      setOutput(data.stdout);
      if (data.stderr) setStderr(data.stderr);
      setDurationMs(data.durationMs);
    } catch (err: any) {
      setStderr(err.message || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(USER_CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDefaultContent = () => {
    const defaultText =
      "Hello! This is the content of myfile.txt.\nNode.js processes this file asynchronously without blocking the single-threaded event loop!";
    setFileContent(defaultText);
  };

  return (
    <div id="async-fs-demo-card" className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Asynchronous File System (<code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded text-xs">fs.readFile</code>)
            </h3>
            <p className="text-xs text-zinc-500">
              Demonstrates Node.js non-blocking I/O and event loop callback ordering
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="copy-fs-code-btn"
            type="button"
            onClick={copyCode}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
          <button
            id="run-fs-btn"
            type="button"
            onClick={runScript}
            disabled={running}
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{running ? "Executing..." : "Run Script (node read-file.cjs)"}</span>
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Code Snippet & Event Loop Flow */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Node.js Script Source (<code className="font-mono text-zinc-900 lowercase">read-file.cjs</code>)
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">CommonJS • fs</span>
            </div>
            <div className="bg-zinc-900 text-zinc-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed shadow-inner">
              <pre className="text-zinc-200 whitespace-pre">{USER_CODE_SNIPPET}</pre>
            </div>
          </div>

          {/* Event Loop Execution Timeline */}
          <div className="border border-zinc-200 rounded-lg p-3.5 bg-zinc-50/50 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-800">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Execution Timeline &amp; Non-Blocking Principle</span>
            </div>

            <ol className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-start space-x-2">
                <span className="font-mono font-bold text-zinc-900 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px]">
                  1
                </span>
                <span>
                  <strong className="text-zinc-900">Main Call Stack:</strong> <code className="font-mono text-zinc-800">fs.readFile('myfile.txt', ...)</code> dispatches file read to Libuv's worker thread pool without pausing execution.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-[10px]">
                  2
                </span>
                <span>
                  <strong className="text-amber-800">Synchronous Step:</strong> <code className="font-mono text-zinc-800">console.log('Reading file... (this runs first!)')</code> prints to stdout immediately!
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px]">
                  3
                </span>
                <span>
                  <strong className="text-emerald-800">I/O Callback:</strong> Once disk I/O completes, the callback <code className="font-mono text-zinc-800">(err, data) =&gt; ...</code> is pushed to the poll queue and invoked, printing <code className="font-mono text-zinc-800">File content: ...</code>.
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: File Content Editor & Live Terminal Output */}
        <div className="space-y-4">
          {/* File Editor for myfile.txt */}
          <div className="border border-zinc-200 rounded-lg p-3.5 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-800 font-mono">myfile.txt</span>
                {fileInfo?.exists ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.5 rounded border border-emerald-200">
                    Exists ({fileInfo.sizeBytes} bytes)
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-50 text-red-700 font-medium px-1.5 py-0.5 rounded border border-red-200">
                    File Missing
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  id="reset-file-btn"
                  type="button"
                  onClick={resetDefaultContent}
                  title="Reset to default text"
                  className="p-1 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  id="save-file-btn"
                  type="button"
                  onClick={saveFile}
                  disabled={savingFile}
                  className="text-xs font-medium px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 hover:bg-zinc-200 disabled:opacity-50 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  {savingFile ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Save className="w-3 h-3 text-zinc-600" />
                  )}
                  <span>{saveSuccess ? "Saved!" : "Save myfile.txt"}</span>
                </button>
              </div>
            </div>

            <textarea
              id="file-content-editor"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              rows={3}
              placeholder="Enter text to store in myfile.txt..."
              className="w-full text-xs font-mono p-2.5 rounded border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-800 resize-none transition-all"
            />
            <p className="text-[11px] text-zinc-500">
              Edit the text above and click <strong>Save</strong> to test how <code className="font-mono text-zinc-700">fs.readFile</code> streams dynamic file contents into your terminal!
            </p>
          </div>

          {/* Terminal Output */}
          <div className="border border-zinc-200 rounded-lg p-3.5 bg-zinc-900 text-zinc-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono flex items-center space-x-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>stdout / stderr Terminal</span>
              </span>
              {durationMs !== null && (
                <span className="flex items-center space-x-1 font-mono text-[11px] text-zinc-400">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{durationMs}ms</span>
                </span>
              )}
            </div>

            <div className="font-mono text-xs bg-zinc-950/80 p-3 rounded border border-zinc-800 min-h-[90px] overflow-x-auto">
              {running ? (
                <div className="flex items-center space-x-2 text-zinc-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Executing node read-file.cjs...</span>
                </div>
              ) : output ? (
                <div className="space-y-1">
                  <div className="text-zinc-500 text-[11px]">$ node read-file.cjs</div>
                  <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">{output}</pre>
                </div>
              ) : (
                <div className="text-zinc-500 italic py-3 text-center">
                  Click "Run Script" to execute read-file.cjs in Node.js
                </div>
              )}

              {stderr && (
                <div className="mt-2 pt-2 border-t border-red-900/50 text-red-400 text-xs">
                  <span className="font-bold">stderr: </span>
                  <pre className="whitespace-pre-wrap">{stderr}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
