/**
 * Multi-Chain Infrastructure Client (Bitcoin & Ethereum simultaneous connection)
 * Demonstrates dual-pipeline Node.js architecture for reading from both networks.
 */

import { ethers } from "ethers";

console.log("=================================================");
console.log("🌐 MULTI-CHAIN NODE.JS INFRASTRUCTURE RUNNER");
console.log("=================================================");
console.log("Connecting simultaneously to Bitcoin (UTXO) & Ethereum (Account)...");

// ==========================================
// 1. ETHEREUM CONNECTION SETUP
// ==========================================
// Connect using public Ethereum JSON-RPC provider (Flashbots / Mainnet endpoint)
const ETH_RPC_URL = process.env.ETH_RPC_URL || "https://rpc.flashbots.net";
const ethProvider = new ethers.JsonRpcProvider(ETH_RPC_URL);

async function getEthereumData() {
  const start = Date.now();
  try {
    const [currentBlock, feeData] = await Promise.all([
      ethProvider.getBlockNumber(),
      ethProvider.getFeeData(),
    ]);

    const gasGwei = feeData.gasPrice
      ? (Number(feeData.gasPrice) / 1e9).toFixed(2)
      : "N/A";

    console.log(`\nΞ ETHEREUM PIPELINE:`);
    console.log(`  🔹 Latest Block:    #${currentBlock}`);
    console.log(`  🔹 Base / Gas Fee:  ${gasGwei} Gwei`);
    console.log(`  🔹 State Model:     Account / Balance (State Trie)`);
    console.log(`  🔹 Latency:         ${Date.now() - start}ms`);
  } catch (error) {
    console.error("  ⚠️ Error fetching Ethereum data:", error.message);
  }
}

// ==========================================
// 2. BITCOIN CONNECTION SETUP
// ==========================================
// Bitcoin uses direct JSON-RPC POST payloads over HTTP (port 8332)
// Or public Esplora / Mempool gateway fallback
const BTC_RPC_URL = process.env.BTC_RPC_URL || "http://127.0.0.1:8332";
const btcAuthUser = process.env.BTC_RPC_USER || "your_bitcoin_conf_username";
const btcAuthPass = process.env.BTC_RPC_PASSWORD || "your_bitcoin_conf_password";

async function getBitcoinData() {
  const start = Date.now();
  console.log(`\n₿ BITCOIN PIPELINE:`);
  try {
    const payload = {
      jsonrpc: "1.0",
      id: "node-app",
      method: "getblockcount",
      params: [],
    };
    const authHeader = "Basic " + Buffer.from(`${btcAuthUser}:${btcAuthPass}`).toString("base64");
    const response = await fetch(BTC_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log(`  🔹 Latest Block:    #${data.result}`);
    console.log(`  🔹 Provider:        Local bitcoind JSON-RPC (port 8332)`);
  } catch (_localErr) {
    // Graceful fallback to public Esplora gateway
    try {
      const [blockResp, feesResp] = await Promise.all([
        fetch("https://mempool.space/api/blocks/tip/height", { signal: AbortSignal.timeout(4000) }),
        fetch("https://mempool.space/api/v1/fees/recommended", { signal: AbortSignal.timeout(4000) }),
      ]);
      const blockHeight = await blockResp.text();
      const feesData = await feesResp.json();
      console.log(`  🔹 Latest Block:    #${blockHeight.trim()}`);
      console.log(`  🔹 Recommended Fee: ${feesData.fastestFee} sat/vB (next block)`);
      console.log(`  🔹 Provider:        Public Esplora / Mempool Node Gateway`);
      console.log(`  🔹 State Model:     UTXO (Unspent Transaction Outputs)`);
      console.log(`  🔹 Latency:         ${Date.now() - start}ms`);
    } catch (err) {
      console.error("  ⚠️ Error fetching Bitcoin data:", err.message);
    }
  }
}

// ==========================================
// 3. EXECUTE SIMULTANEOUSLY
// ==========================================
async function main() {
  await Promise.all([getEthereumData(), getBitcoinData()]);
  console.log("\n=================================================");
  console.log("✅ Multi-chain pipelines synchronized successfully!");
  console.log("=================================================");
}

main();
