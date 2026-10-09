import React, { useState } from "react";
import {
  Boxes,
  Copy,
  Check,
  Play,
  Terminal,
  Sparkles,
  User,
  Palette,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

const CODE_SNIPPET = `// Object
const user = {
  name: 'Alice',
  age: 25,
  greet() {
    console.log(\`Hi, I'm \${this.name}\`);
  }
};

// Array
const colors = ['red', 'green', 'blue'];

// Array methods (ES6+)
colors.forEach(color => console.log(color));
const lengths = colors.map(color => color.length);

// Destructuring & Template Literals (ES6+)
const { name } = user;
console.log(\`Hello, \${name}!\`);`;

export function ObjectsArraysDemo() {
  const [userName, setUserName] = useState<string>("Alice");
  const [userAge, setUserAge] = useState<number>(25);
  const [colorInput, setColorInput] = useState<string>("red, green, blue");
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<{
    command: string;
    greetOutput: string;
    colors: string[];
    lengths: number[];
    stdout: string;
    durationMs: number;
  } | null>({
    command: 'node objects-arrays.js "Alice" 25 "red,green,blue"',
    greetOutput: "Hi, I'm Alice",
    colors: ["red", "green", "blue"],
    lengths: [3, 5, 4],
    stdout: "Hi, I'm Alice\nred\ngreen\nblue\nLengths: [3,5,4]\n",
    durationMs: 38,
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
      const res = await fetch("/api/run-objects-arrays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          age: userAge,
          colors: colorInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Execution failed");
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
      id="objects-arrays-card"
      className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Objects, Arrays &amp; Destructuring
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ES6+ Data Structures
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Object methods, array iteration (<code>forEach</code>, <code>map</code>), destructuring assignment &amp; template literals
            </p>
          </div>
        </div>

        <button
          id="copy-objects-code-btn"
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

      {/* Main Content */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Code Preview & Concepts */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>objects-arrays.js</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">Node.js ES6+</span>
            </div>

            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-4 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="text-emerald-300/95">
                <code>{CODE_SNIPPET}</code>
              </pre>
            </div>

            {/* Concept Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  1. Object Methods
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Methods use <code className="text-zinc-800 font-mono">this.name</code> to access object properties within context.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  2. forEach vs map
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  <code className="text-zinc-800 font-mono">forEach</code> executes side effects; <code className="text-zinc-800 font-mono">map</code> returns a transformed new array.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="font-semibold text-zinc-900 block text-[11px]">
                  3. Destructuring
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  <code className="text-zinc-800 font-mono">{`const { name } = user`}</code> unpacks values directly into distinct variables.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Runner */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Execute In Node.js Process</span>
              </span>
              <button
                id="run-objects-btn"
                type="button"
                onClick={executeCode}
                disabled={running}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>{running ? "Running..." : "Run in Node.js"}</span>
              </button>
            </div>

            {/* Parameter Inputs */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Dynamic Parameters:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-zinc-400" />
                    <span>user.name</span>
                  </label>
                  <input
                    id="obj-name-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    placeholder="Alice"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    <span>user.age</span>
                  </label>
                  <input
                    id="obj-age-input"
                    type="number"
                    value={userAge}
                    onChange={(e) => setUserAge(Number(e.target.value))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center space-x-1">
                    <Palette className="w-3 h-3 text-zinc-400" />
                    <span>colors (CSV)</span>
                  </label>
                  <input
                    id="obj-colors-input"
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    placeholder="red, green, blue"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Results Terminal Display */}
            <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
              <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Output Diagnostics</span>
                </div>
                {result && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>0 errors</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-3">
                {result ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-900/90 p-2.5 rounded border border-zinc-800">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">
                          user.greet() Method
                        </div>
                        <div className="text-emerald-400 font-bold text-sm mt-0.5">
                          {result.greetOutput}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          Destructured: <span className="text-zinc-300">name = &quot;{userName}&quot;</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/90 p-2.5 rounded border border-zinc-800">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">
                          colors.map(color =&gt; color.length)
                        </div>
                        <div className="text-cyan-400 font-bold text-sm mt-0.5">
                          [{result.lengths.join(", ")}]
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          Items: <span className="text-zinc-300">{result.colors.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-sans">
                        Process Command:
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
                      <span>Execution duration: {result.durationMs}ms</span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-500 italic py-3">
                    Click &quot;Run in Node.js&quot; to execute.
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
              CLI command: <code className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">node objects-arrays.js</code>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            npm run run:objects
          </div>
        </div>
      </div>
    </div>
  );
}
