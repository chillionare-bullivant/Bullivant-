import React, { useState } from "react";
import {
  BookOpen,
  Code2,
  CheckCircle2,
  Boxes,
  Layers,
  Terminal,
  AlertTriangle,
  FileCode2,
  Zap,
  Copy,
  Check,
  Play,
} from "lucide-react";

interface ConceptItem {
  id: string;
  title: string;
  badge: string;
  category: string;
  summary: string;
  codeSnippet: string;
  tips: string[];
}

const CONCEPTS: ConceptItem[] = [
  {
    id: "variables",
    title: "Variables (let, const, var)",
    badge: "Storage",
    category: "Declaration",
    summary:
      "Modern JavaScript prefers const by default for immutable bindings and let for values that will change. The legacy var is function-scoped and hoisted.",
    codeSnippet: `let name = 'Node.js'; // mutable
const version = 20;   // immutable binding
var legacy = true;    // function-scoped (avoid in modern code)`,
    tips: [
      "Use const by default for variables, functions, and imported modules.",
      "Use let only when reassigning loop counters or state flags.",
      "Never use var to avoid unexpected hoisting bugs.",
    ],
  },
  {
    id: "functions",
    title: "Functions: Regular, Arrow & Methods",
    badge: "Logic",
    category: "Execution",
    summary:
      "Regular function declarations provide dynamic this binding and hoisting. Arrow functions have concise syntax, implicit return, and lexical this binding.",
    codeSnippet: `// Function declaration (hoisted)
function greet(user) {
  return \`Hello, \${user}!\`;
}

// Arrow function (concise, lexical this)
const add = (a, b) => a + b;

// Object method
const calc = {
  factor: 2,
  multiply(n) { return n * this.factor; }
};`,
    tips: [
      "Use arrow functions for callbacks and array pipelines (map, filter).",
      "Use standard function methods when you need dynamic this context.",
    ],
  },
  {
    id: "destructure",
    title: "Destructuring & Template Literals",
    badge: "Syntax",
    category: "ES6+",
    summary:
      "Destructuring unpacks values from arrays or properties from objects into distinct variables. Template literals enable clean string interpolation with backticks.",
    codeSnippet: `const user = { name: 'Alice', age: 25 };
const { name } = user; // Object destructuring

const colors = ['red', 'green', 'blue'];
const [primary] = colors; // Array destructuring

console.log(\`Hello, \${name}! Primary color is \${primary}.\`);`,
    tips: [
      "Use destructuring when importing specific exports or pulling API payload fields.",
      "Template literals support multiline strings without \\n escapes.",
    ],
  },
  {
    id: "modules",
    title: "Modules: CommonJS vs ES Modules",
    badge: "Architecture",
    category: "Packaging",
    summary:
      "Node.js supports both CommonJS (require / module.exports) and ES Modules (import / export). In package.json, \"type\": \"module\" enables ESM natively.",
    codeSnippet: `// CommonJS (.cjs or default in older Node)
const fs = require('fs');
module.exports = { doSomething };

// ES Modules (.mjs or "type": "module" in package.json)
import express from 'express';
export default app;`,
    tips: [
      "Vite and modern TypeScript default to ES Module import syntax.",
      "Node 22+ supports running TypeScript files directly with type stripping.",
    ],
  },
  {
    id: "error-handling",
    title: "Error Handling: try / catch Blocks",
    badge: "Resilience",
    category: "Control Flow",
    summary:
      "Guarding synchronous and asynchronous await operations prevents unhandled exceptions from crashing the Node.js process.",
    codeSnippet: `try {
  const data = JSON.parse(rawString);
  const result = await databaseQuery();
} catch (error) {
  console.error('Handled error gracefully:', error.message);
} finally {
  cleanupResources();
}`,
    tips: [
      "Always wrap JSON.parse and network/file I/O in try/catch.",
      "In Express routes, catch errors and return structured 500 JSON instead of hanging the connection.",
    ],
  },
];

export function JsConceptsSummaryCard() {
  const [activeConceptId, setActiveConceptId] = useState<string>("variables");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeConcept =
    CONCEPTS.find((c) => c.id === activeConceptId) || CONCEPTS[0];

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      id="js-concepts-card"
      className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 sm:p-5 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Key JavaScript &amp; Node.js Concepts
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                Comprehensive Reference
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Variables, Functions, Objects, Arrays, Destructuring, Modules, and Error Handling
            </p>
          </div>
        </div>

        <span className="text-xs text-zinc-400 font-mono">
          5 Core Pillars
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center overflow-x-auto border-b border-zinc-200 bg-zinc-50/40 px-4 pt-2 gap-1.5 scrollbar-none">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveConceptId(c.id)}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-medium border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeConceptId === c.id
                ? "bg-white text-zinc-900 border-zinc-200 -mb-px font-semibold shadow-2xs"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
            }`}
          >
            {c.title.split(":")[0]}
          </button>
        ))}
      </div>

      {/* Active Concept Details */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {activeConcept.title}
            </h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-2xl">
              {activeConcept.summary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(activeConcept.id, activeConcept.codeSnippet)}
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
          >
            {copiedId === activeConcept.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code Box */}
        <div className="rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 p-4 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
          <pre className="text-indigo-300/95">
            <code>{activeConcept.codeSnippet}</code>
          </pre>
        </div>

        {/* Best Practice Tips */}
        <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Node.js Production Best Practices:
          </div>
          <ul className="space-y-1.5">
            {activeConcept.tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-zinc-600 flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
