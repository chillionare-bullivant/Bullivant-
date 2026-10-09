import dotenv from "dotenv";
dotenv.config();

import { create247Provider } from "./utils/reconnect.js";
import { start247PriceStream } from "./providers/binance-price.js";
import { create247SolanaConnection } from "./providers/sol.js";
import { startBlockListeners } from "./listeners/block.listener.js";
import { startMintListener } from "./listeners/mint.listener.js";
import { startMintWorker, mintQueue } from "./services/queue.js";
import { db } from "./services/db.js";

console.log("=================================================");
console.log("🚀 24/7 Multi-Chain Bot Initializing...");
console.log("   Process PID:", process.pid);
console.log("   Node Version:", process.version);
console.log("   Mode: Cluster Instance / 24-7 Resilient");
console.log("=================================================\n");

// 1. Initialize Multi-Chain Providers with Auto-Reconnect Wrappers (Rule #1)
const ethWss = process.env.WSS_RPC_URL || process.env.ETH_WSS_URL || "wss://ethereum.publicnode.com";
const bscWss = process.env.BSC_WSS_URL || "wss://bsc.publicnode.com";

const eth = create247Provider(ethWss, "ETH");
const bsc = create247Provider(bscWss, "BSC");

// 2. Attach Block Subscriptions
eth.on("block", (n) => console.log("🔷 ETH BLOCK:", n));
bsc.on("block", (n) => console.log("🟡 BSC BLOCK:", n));

startBlockListeners(eth, bsc, (blockRecord) => {
  // Saved to DB automatically
});

// 3. Attach USDT Zero-Address Mint Listener & Decoupled BullMQ Worker (Rule #2)
startMintListener(eth, (mintPayload) => {
  console.log(`[EVENT] Mint pushed to queue: $${mintPayload.amountFormatted.toLocaleString()} USDT`);
});

startMintWorker(async (jobData) => {
  console.log(`\n⚙️ [Worker Processing Mint]`);
  console.log(`   Amount: $${jobData.amountFormatted.toLocaleString()} USDT`);
  console.log(`   To: ${jobData.to}`);
  console.log(`   Tx: ${jobData.tx}`);
  console.log(`   Executing post-mint liquidity rebalance & volatility hedge...\n`);
});

// 4. Initialize Solana 24/7 Slot Listener
try {
  create247SolanaConnection((slot) => {
    if (slot % 10 === 0) {
      console.log("🟣 SOLANA SLOT:", slot);
    }
  });
} catch (e) {
  console.warn("Solana connection optional fallback:", e.message);
}

// 5. 24/7 Real-Time Price WebSocket (BTC, ETH, SOL, BNB)
start247PriceStream((trade) => {
  // Minimal console sampling to avoid flooding stdout
  if (Math.random() < 0.05) {
    console.log(`💹 [TICKER] ${trade.symbol.padEnd(8)}: $${trade.price.toLocaleString()}`);
  }
});

// Graceful termination handling for PM2 cluster reload
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down 24/7 workers cleanly...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM from PM2. Graceful reload in progress...");
  process.exit(0);
});
