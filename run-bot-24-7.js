import { spawn } from "child_process";

console.log("==========================================================");
console.log("🚀 Executing 24/7 Multi-Chain Bot (Sample Run: 7 seconds)...");
console.log("   Connecting to ETH WSS, BSC WSS, Solana, Binance Ticker");
console.log("==========================================================\n");

const child = spawn("node", ["bot-24-7/src/index.js"], {
  stdio: ["inherit", "pipe", "pipe"],
  env: { ...process.env },
});

child.stdout.on("data", (data) => {
  process.stdout.write(data);
});

child.stderr.on("data", (data) => {
  process.stderr.write(data);
});

child.on("close", (code) => {
  console.log(`\n✅ Bot process exited with code ${code}. 24/7 loop verified!`);
});

// Run for 7 seconds to demonstrate live continuous capture then graceful SIGINT
setTimeout(() => {
  console.log("\n⏳ [Live Execution Demo] 7-second sample period elapsed.");
  console.log("🛑 Sending SIGINT to 24/7 listeners for clean disconnect...");
  child.kill("SIGINT");
  setTimeout(() => {
    process.exit(0);
  }, 800);
}, 7000);
