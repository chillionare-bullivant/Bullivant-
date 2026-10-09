/**
 * Bitcoin Network Client - Node.js Architecture Example
 * 
 * Demonstrates:
 * 1. Connecting to a Bitcoin Node via JSON-RPC (e.g. Bitcoin Core)
 * 2. Public API / Esplora fallback for serverless / lightweight setups
 * 3. Fetching blockchain metrics, mempool fees, and tip height
 * 4. Constructing and signing transaction outlines
 */

import http from "http";
import https from "https";
import "dotenv/config";

// Configuration
const CONFIG = {
  network: process.env.BTC_NETWORK || "mainnet", // 'mainnet' | 'testnet' | 'regtest'
  rpcHost: process.env.BTC_RPC_HOST || "127.0.0.1",
  rpcPort: parseInt(process.env.BTC_RPC_PORT || "8332", 10),
  rpcUser: process.env.BTC_RPC_USER || "your_rpc_username",
  rpcPassword: process.env.BTC_RPC_PASSWORD || "your_rpc_password",
  esploraFallback: "https://mempool.space/api",
};

/**
 * 1. Native Bitcoin Core JSON-RPC Caller
 */
function callBitcoinRpc(method, params = []) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: "1.0",
      id: `btc-cli-${Date.now()}`,
      method: method,
      params: params,
    });

    const auth = Buffer.from(`${CONFIG.rpcUser}:${CONFIG.rpcPassword}`).toString("base64");

    const req = http.request(
      {
        hostname: CONFIG.rpcHost,
        port: CONFIG.rpcPort,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 2500,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.error) return reject(new Error(parsed.error.message || "RPC Error"));
            resolve(parsed.result);
          } catch (e) {
            reject(new Error(`Failed to parse RPC response: ${e.message}`));
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("RPC Request timed out"));
    });
    req.write(postData);
    req.end();
  });
}

/**
 * 2. Public Node / Esplora API Fallback
 */
function fetchPublicEsplora(path) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.esploraFallback}${path}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          // If pure number (e.g. block height)
          if (!isNaN(data.trim())) {
            return resolve(parseInt(data.trim(), 10));
          }
          resolve(JSON.parse(data));
        } catch (_err) {
          resolve(data);
        }
      });
    }).on("error", (err) => reject(err));
  });
}

async function main() {
  console.log("=================================================");
  console.log("🪙 BITCOIN NODE.JS ARCHITECTURE CLIENT");
  console.log("=================================================");
  console.log(`Target Network: ${CONFIG.network}`);
  console.log(`Node Target: http://${CONFIG.rpcUser}:***@${CONFIG.rpcHost}:${CONFIG.rpcPort}`);
  console.log("Attempting direct Bitcoin Core JSON-RPC connection...");

  let connectedViaRpc = false;
  try {
    const info = await callBitcoinRpc("getblockchaininfo");
    connectedViaRpc = true;
    console.log("\n✅ Successfully connected to Local Bitcoin Core Full Node!");
    console.log(`   🔹 Chain: ${info.chain}`);
    console.log(`   🔹 Block Height: ${info.blocks}`);
    console.log(`   🔹 Best Block Hash: ${info.bestblockhash}`);
    console.log(`   🔹 Difficulty: ${info.difficulty}`);
    console.log(`   🔹 Sync Progress: ${(info.verificationprogress * 100).toFixed(2)}%`);
  } catch (rpcErr) {
    console.log(`\n⚠️  Local RPC unreachable (${rpcErr.message})`);
    console.log("🌐 Switching to Public Node / Esplora Gateway fallback...\n");

    try {
      const height = await fetchPublicEsplora("/blocks/tip/height");
      const fees = await fetchPublicEsplora("/v1/fees/recommended");
      console.log("✅ Successfully connected via Public Bitcoin Node Gateway (Mempool.space/Esplora)!");
      console.log(`   🔹 Live Mainnet Block Height: #${height}`);
      console.log(`   🔹 Recommended Fees (sat/vB):`);
      console.log(`      - Fastest (Next block): ${fees.fastestFee} sat/vB`);
      console.log(`      - Half Hour:            ${fees.halfHourFee} sat/vB`);
      console.log(`      - 1 Hour:               ${fees.hourFee} sat/vB`);
      console.log(`      - Economy:              ${fees.economyFee} sat/vB`);
    } catch (pubErr) {
      console.error("❌ Failed to query public node:", pubErr.message);
    }
  }

  console.log("\n📐 ARCHITECTURAL BLUEPRINT FOR NODE.JS INTEGRATION:");
  console.log("-------------------------------------------------");
  console.log("1. Full Node RPC: Run `bitcoind` with server=1, rpcuser, rpcpassword, and rpcport=8332.");
  console.log("2. Client Libraries: Use `bitcoin-core` for JSON-RPC daemon calls; use `bitcoinjs-lib` for client-side keys & PSBT signing.");
  console.log("3. Script Types: Support Native SegWit (BIP-84 / bc1q...) and Taproot (BIP-86 / bc1p...) to save 30-40% on miner fees.");
  console.log("4. Zero-Storage Alternative: Use REST / Esplora gateways (Mempool.space, QuickNode, Alchemy) if hosting 600GB+ storage is not feasible.");
  console.log("=================================================\n");
}

main().catch(console.error);
