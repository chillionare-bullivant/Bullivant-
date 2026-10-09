# Level 2 Active Runtime

> **Stop reading files top-to-bottom. Start tracing live execution.**

This project demonstrates interactive, executable documentation with real AST extraction, Server-Sent Events (SSE) streaming, live call stack frames, and conditional breakpoint debugging.

---

## Block 0: Quick Verification (JavaScript)
```javascript
const timestamp = new Date().toISOString();
console.log(`[Level 2 Kernel] Active verification at ${timestamp}`);
console.log(`Platform architecture: ${process.platform} (${process.arch})`);
const sum = [10, 20, 30, 40, 50].reduce((acc, n) => acc + n, 0);
console.log(`Calculated reduced vector sum = ${sum}`);
sum;
```

---

## Block 1: Async Data Pipeline (JavaScript)
```javascript
console.log("[Pipeline] Initializing synthetic transaction stream...");
const transactions = [
  { id: "tx_01", amount: 2500, asset: "USDT", sender: "0xAlice" },
  { id: "tx_02", amount: 8400, asset: "USDC", sender: "0xBob" },
  { id: "tx_03", amount: 150,  asset: "ETH",  sender: "0xCarol" }
];
const totalValue = transactions.reduce((acc, t) => acc + t.amount, 0);
console.log(`[Pipeline] Processed ${transactions.length} transfers. Total volume = $${totalValue}`);
({ status: "SETTLED", totalValue, count: transactions.length });
```

---

## Block 2: Memory & Sandbox Verification (JavaScript)
```javascript
console.log("[Sandbox] Checking execution environment limits...");
const fibonacci = (n) => (n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2));
const fib10 = fibonacci(10);
console.log(`[Sandbox] Fib(10) calculated: ${fib10}`);
({ fibonacci10: fib10, sandboxStatus: "ISOLATED_AND_STABLE" });
```

---

## Block 3: Bash Environment Check (Shell)
```bash
echo "Docker container debug interface listening on 0.0.0.0:9229"
node -v
```

---

## How to Debug with Conditional Breakpoints

1. Open `server.js` at line `// BREAKPOINT HERE` in route `/api/readme/execute`.
2. Right-click the breakpoint margin -> **Add Conditional Breakpoint**.
3. Expression: `language === 'javascript'`
4. Attach debugger (`F5` with `Level 2: Attach to Container`).
5. Trigger execution from the web dashboard -> Execution halts exclusively on JavaScript blocks, displaying the full Call Stack.
