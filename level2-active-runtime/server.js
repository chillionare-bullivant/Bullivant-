const express = require('express');
const { marked } = require('marked');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');

// Secure VM sandbox with graceful fallback
let VM;
try {
  VM = require('vm2').VM;
} catch (_e) {
  const vm = require('vm');
  VM = class {
    constructor(options = {}) {
      this.timeout = options.timeout || 5000;
      this.sandbox = options.sandbox || {};
    }
    run(code) {
      const context = vm.createContext({ ...this.sandbox });
      const script = new vm.Script(code);
      return script.runInContext(context, { timeout: this.timeout });
    }
  };
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateSyntax(code, language) {
  const lang = (language || '').toLowerCase().trim();
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    try {
      new Function(code);
      return { isValid: true, error: null };
    } catch (err) {
      return { isValid: false, error: err.message };
    }
  }
  if (lang === 'json') {
    try {
      JSON.parse(code);
      return { isValid: true, error: null };
    } catch (err) {
      return { isValid: false, error: err.message };
    }
  }
  if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
    const doubleQuotes = (code.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) return { isValid: false, error: 'Syntax Error: Unmatched double quote (")' };
    const singleQuotes = (code.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) return { isValid: false, error: "Syntax Error: Unmatched single quote (')" };
    return { isValid: true, error: null };
  }
  return { isValid: true, error: null };
}

function parseReadmeCodeBlocks(md) {
  const tokens = marked.lexer(md); // AST Extraction
  return tokens.filter(t => t.type === 'code').map((t, i) => {
    const validation = validateSyntax(t.text, t.lang);
    return {
      id: `block-${i}`,
      language: t.lang || 'text',
      code: t.text,
      rawToken: t, // Keep AST for debugging call stack
      isValidSyntax: validation.isValid,
      syntaxError: validation.error
    };
  });
}

app.get('/api/readme/blocks', async (req, res) => {
  try {
    const readmePath = path.join(__dirname, 'README.md');
    const md = await fs.readFile(readmePath, 'utf-8');
    const blocks = parseReadmeCodeBlocks(md);
    res.json({ blocks }); // STEP 1: Set breakpoint here to see Call Stack
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/readme/execute', async (req, res) => {
  const { blockId, code, language } = req.body; // BREAKPOINT HERE -> Add condition: language === 'javascript'

  // Validation layer check before attempting to stream execution
  const syntaxCheck = validateSyntax(code, language);
  if (!syntaxCheck.isValid) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: `Syntax validation failed: ${syntaxCheck.error}`,
      validationPassed: false
    }));
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  const send = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ stack: new Error().stack.split('\n').slice(1,4).map(s => s.trim()), data })}\n\n`);

  send('status', `Executing ${blockId} (${language}) with timeout 5s`);

  // Secure JS execution
  try {
    const vm = new VM({
      timeout: 5000,
      sandbox: {
        console: { log: (...a) => send('stdout', a.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(' ')) },
        process: { platform: process.platform, arch: process.arch },
        Date: Date,
        Math: Math,
        JSON: JSON,
      }
    });
    const result = vm.run(code);
    send('status', `Done. Result: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
  } catch (e) {
    send('stderr', e.message);
  }
  res.end();
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Level 2 running on http://localhost:${PORT} - Debug on 0.0.0.0:9229`));
}

module.exports = { app, parseReadmeCodeBlocks };
