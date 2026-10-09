# ⚡ 24/7 Resilient Multi-Chain Bot & Listener Blueprint

> **The Crash-Proof Architecture for Crypto Listeners, USDT Mint Trackers, and DEX Arbitrage Engines**

Built for production multi-chain structures monitoring Ethereum, BSC, Solana, and Binance trade streams 24/7 without missing a block or dropping a transaction.

---

## 🏛️ The 3 Non-Negotiable Rules for 24/7

### 1. Never Use a Single Raw Provider → Use the Auto-Reconnect Wrapper
- **File**: `src/utils/reconnect.js`
- **Why**: Raw WebSocket providers disconnect during ISP drops, provider restarts, or load-balancer socket rotations (typically every 1–2 hours).
- **Solution**: The `create247Provider` wrapper catches `close` and `error` events, keeps an isolated retry loop with a 3-second delay, and seamlessly restores subscription state without terminating the process.

### 2. Put Everything in a Queue → Decouple Ingestion from Processing
- **File**: `src/services/queue.js` & `src/listeners/mint.listener.js`
- **Why**: During market volatility or flash crashes, 100+ mints, liquidations, or block events can arrive within a 200ms window. If your listener awaits database writes or external RPC calls, the WebSocket socket buffer overflows and drops subsequent transactions.
- **Solution**: The listener immediately pushes raw events to BullMQ (`mintQueue.add(...)`) in <1ms and continues listening. Background workers process jobs asynchronously at controlled concurrency.

### 3. Run with PM2 in Cluster Mode (2+ Instances)
- **File**: `ecosystem.config.js`
- **Why**: If one process experiences an unexpected node crash or memory spike (`max_memory_restart: 500M`), the second instance handles uninterrupted stream capture while PM2 revives the crashed worker.
- **Command**: `pm2 start ecosystem.config.js`

---

## 📁 Project Structure

```
bot-24-7/
├── src/
│   ├── providers/
│   │   ├── eth.js            // WebSocketProvider with auto-reconnect
│   │   ├── sol.js            // Solana slot & log listener with auto-reconnect
│   │   ├── bsc.js            // BSC WebSocketProvider with auto-reconnect
│   │   └── binance-price.js  // 24/7 Binance combined ticker (BTC, ETH, SOL, BNB)
│   ├── listeners/
│   │   ├── block.listener.js // Real-time block listener for ETH & BSC
│   │   ├── mint.listener.js  // Catches USDT mints from ethers.ZeroAddress
│   │   └── transfer.listener.js // Whale transfer monitor
│   ├── services/
│   │   ├── queue.js          // BullMQ queue with zero-crash in-memory fallback
│   │   └── db.js             // Event and block storage
│   ├── utils/
│   │   └── reconnect.js      // Core heartbeat & auto-reconnect wrapper
│   └── index.js              // Orchestration entrypoint
├── ecosystem.config.js       // PM2 cluster config (2 instances, auto-restart)
├── package.json
└── .env.example
```

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Development run with file watcher
npm run dev

# 4. Production run with PM2 cluster
npm run pm2:start

# 5. Monitor real-time logs & CPU
npm run pm2:monit
```
