import { db } from "../services/db.js";

/**
 * 24/7 Block Listener
 * Listens for new blocks on ETH & BSC via WebSocket events.
 *
 * @param {ethers.WebSocketProvider} ethProvider
 * @param {ethers.WebSocketProvider} bscProvider
 * @param {Function} [onBlockNotify]
 */
export function startBlockListeners(ethProvider, bscProvider, onBlockNotify) {
  console.log("🧱 [Block Listener] Initializing continuous block subscriptions...");

  // ETH Block Listener
  if (ethProvider) {
    try {
      ethProvider.on("block", async (blockNumber) => {
        const record = await db.saveBlock("ETH", blockNumber);
        console.log(`🔷 [ETH BLOCK] #${blockNumber} (Recorded at ${new Date().toISOString()})`);
        if (onBlockNotify) onBlockNotify(record);
      });
    } catch (err) {
      console.error("[ETH Block Listener] Subscription error:", err.message);
    }
  }

  // BSC Block Listener
  if (bscProvider) {
    try {
      bscProvider.on("block", async (blockNumber) => {
        const record = await db.saveBlock("BSC", blockNumber);
        console.log(`🟡 [BSC BLOCK] #${blockNumber} (Recorded at ${new Date().toISOString()})`);
        if (onBlockNotify) onBlockNotify(record);
      });
    } catch (err) {
      console.error("[BSC Block Listener] Subscription error:", err.message);
    }
  }
}
