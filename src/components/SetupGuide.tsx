import React, { useState } from "react";
import { Check, Copy, FileCode, Terminal, CheckCircle, Layers, BookOpen } from "lucide-react";

const CODE_FILES: Record<string, { label: string; desc: string; code: string }> = {
  "index.js": {
    label: "index.js",
    desc: "Single turn text generation with @google/genai",
    code: `import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: "Hello! Tell me a quick joke about Node.js.",
  });

  console.log(response.text);
}

main();`,
  },
  "stream.js": {
    label: "stream.js",
    desc: "Real-time token streaming with async iterator",
    code: `import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.1-flash-lite",
    contents: "Explain why Node.js is well-suited for streaming data and AI integration.",
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
    }
  }
}

main();`,
  },
  "chat.js": {
    label: "chat.js",
    desc: "Multi-turn conversation session with history",
    code: `import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const chat = ai.chats.create({
    model: "gemini-3.1-flash-lite",
    config: {
      systemInstruction: "You are an expert Node.js architect and mentor.",
    },
  });

  const response1 = await chat.sendMessage({
    message: "What is the difference between synchronous and asynchronous operations in Node.js?",
  });
  console.log("Turn 1:", response1.text);

  const response2 = await chat.sendMessage({
    message: "Give me a quick 3-line example contrasting both using fs.",
  });
  console.log("Turn 2:", response2.text);
}

main();`,
  },
  "structured.js": {
    label: "structured.js",
    desc: "Typed JSON schema enforcement with Type.OBJECT",
    code: `import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: "Analyze the strengths and common use cases of Node.js for backend API development.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedUseCases: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["topic", "summary", "strengths", "recommendedUseCases"],
      },
    },
  });

  const data = JSON.parse(response.text);
  console.log(data);
}

main();`,
  },
  "cli-express.cjs": {
    label: "cli-express.cjs",
    desc: "CLI stdout logger, os.platform(), and Express port 8080",
    code: `console.log('This example is different!');
console.log('The result is displayed in the Command Line Interface');

const os = require('os');
console.log(os.platform());

const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(8080, () => {
  console.log('Express listening on port 8080');
});`,
  },
  "hello-http.cjs": {
    label: "hello-http.cjs",
    desc: "Native Node.js http.createServer()",
    code: `const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!');
}).listen(8080, () => {
  console.log('Server running on port 8080');
});`,
  },
  "read-file.cjs": {
    label: "read-file.cjs",
    desc: "Asynchronous non-blocking fs.readFile() & event loop order",
    code: `// Load the filesystem module
const fs = require('fs');

// Read file asynchronously
fs.readFile('myfile.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file: ' + err);
    return;
  }
  console.log('File content: ' + data);
});

console.log('Reading file... (this runs first!)');`,
  },
  "variables-functions.js": {
    label: "variables-functions.js",
    desc: "Variables (let, const), template literals, & arrow functions",
    code: `// Variables (let, const, var)
let name = 'Node.js';
const version = 20;

// Function declaration
function greet(user) {
  return \`Hello, \${user}!\`; // Template literal (ES6)
}

// Arrow function (ES6+)
const add = (a, b) => a + b;

console.log(greet('Developer')); // Hello, Developer!
console.log(add(5, 3)); // 8`,
  },
  "objects-arrays.js": {
    label: "objects-arrays.js",
    desc: "Objects, methods with 'this', forEach, and map methods",
    code: `// Object
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
console.log('Lengths: ' + JSON.stringify(lengths));`,
  },
  "async-demo.js": {
    label: "async-demo.js",
    desc: "Callbacks, Promises, & modern Async/Await",
    code: `// 1. Callbacks (traditional)
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

getData(); // Call the async function`,
  },
  "destructuring-concepts.js": {
    label: "destructuring-concepts.js",
    desc: "Destructuring, try/catch, and CommonJS vs ESM",
    code: `// Destructuring & Template Literals (ES6+)
const user = { name: 'Alice', age: 25 };
const { name } = user;
console.log(\`Hello, \${name}!\`);

// Error Handling: try/catch
try {
  JSON.parse('invalid json');
} catch (err) {
  console.log('Caught error:', err.message);
}`,
  },
  "scanner.js": {
    label: "scanner.js",
    desc: "Multi-Pool DEX Price Scanner (Uniswap V3 × SushiSwap)",
    code: `const { ethers } = require("ethers");
require("dotenv").config();

// WebSocket Provider & Contracts
const provider = new ethers.WebSocketProvider(process.env.WSS_RPC_URL);
const uniContract = new ethers.Contract(poolUniswapV3, uniV3PoolAbi, provider);
const sushiContract = new ethers.Contract(poolSushiSwap, sushiswapPairAbi, provider);

// Memory cache
let latestPrices = { uniswap: 0n, sushiswap: 0n };

// Event listeners
uniContract.on("Swap", async (...args) => {
  latestPrices.uniswap = args[4]; // sqrtPriceX96
  evaluateCrossDEXSpread();
});

sushiContract.on("Sync", async (r0, r1) => {
  if (r0 > 0n) {
    latestPrices.sushiswap = (r1 * 10n**18n) / r0;
    evaluateCrossDEXSpread();
  }
});`,
  },
};

export function SetupGuide() {
  const [activeTab, setActiveTab] = useState<"code" | "steps">("code");
  const [selectedFile, setSelectedFile] = useState<string>("index.js");
  const [copied, setCopied] = useState<boolean>(false);

  const activeCodeData = CODE_FILES[selectedFile] || CODE_FILES["index.js"];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="setup-guide-card" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Header */}
      <div className="border-b border-zinc-100 p-2 sm:px-4 bg-zinc-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            id="tab-code-btn"
            type="button"
            onClick={() => setActiveTab("code")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === "code"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Code Files ({Object.keys(CODE_FILES).length})</span>
          </button>
          <button
            id="tab-steps-btn"
            type="button"
            onClick={() => setActiveTab("steps")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === "steps"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Setup Steps</span>
          </button>
        </div>

        {activeTab === "code" && (
          <button
            id="copy-code-btn"
            type="button"
            onClick={() => copyToClipboard(activeCodeData.code)}
            className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* File Sub-navigation */}
      {activeTab === "code" && (
        <div className="px-4 py-2 bg-zinc-100/60 border-b border-zinc-200/80 flex items-center gap-1.5 overflow-x-auto text-xs">
          {Object.entries(CODE_FILES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedFile(key)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                selectedFile === key
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {activeTab === "code" ? (
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono text-zinc-600 font-medium">/{selectedFile}</span>
              <span className="text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                {activeCodeData.desc}
              </span>
            </div>

            <div className="flex-1 relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs shadow-inner">
              <pre className="p-4 text-emerald-400 overflow-x-auto h-full max-h-[380px] leading-relaxed whitespace-pre font-mono">
                {activeCodeData.code}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span>Project Initialization</span>
              </h4>
              <p className="text-zinc-600 pl-6">
                Initialize your Node.js application and install the official Gemini TypeScript/JavaScript SDK:
              </p>
              <div className="pl-6">
                <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
{`mkdir my-gemini-node-app
cd my-gemini-node-app
npm init -y
npm install @google/genai dotenv express`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span>Environment Variable Configuration</span>
              </h4>
              <p className="text-zinc-600 pl-6">
                Store your API key in a secure <code>.env</code> file (never committed to git):
              </p>
              <div className="pl-6">
                <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
{`# .env
GEMINI_API_KEY=AIzaSy...`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <span>Execution Commands</span>
              </h4>
              <p className="text-zinc-600 pl-6">Run any of the tutorial scripts via the command line:</p>
              <div className="pl-6">
                <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
{`node index.js        # Basic generation
node stream.js       # Real-time token streaming
node chat.js         # Multi-turn contextual chat
node structured.js   # JSON schema enforcement
node cli-express.cjs # CLI stdout & Express server`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
