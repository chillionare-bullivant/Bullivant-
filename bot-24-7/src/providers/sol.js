import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config();

/**
 * Solana 24/7 WebSocket Connection
 * Subscribes to slot notifications and program logs (e.g., Raydium/Orca DEX swaps).
 */
export function create247SolanaConnection(onSlot, onLog) {
  const solWssUrl = process.env.SOL_WSS_URL || "wss://api.mainnet-beta.solana.com";
  let ws = null;
  let isClosed = false;

  function connect() {
    console.log(`[24/7 Solana] Connecting to ${solWssUrl}...`);
    ws = new WebSocket(solWssUrl);

    ws.on("open", () => {
      console.log("🟣 [24/7 Solana] Connected successfully. Subscribing to slotUpdate...");
      // Subscribe to slot updates
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "slotSubscribe"
      }));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.params && msg.params.result) {
          const slot = msg.params.result.slot || msg.params.result.root;
          if (slot && onSlot) onSlot(slot);
        }
      } catch (err) {
        // parse error ignored
      }
    });

    ws.on("close", (code) => {
      if (isClosed) return;
      console.warn(`[24/7 Solana] WebSocket closed (code: ${code}). Reconnecting in 3s...`);
      setTimeout(connect, 3000);
    });

    ws.on("error", (err) => {
      console.error("[24/7 Solana] WebSocket error:", err.message);
    });
  }

  connect();

  return {
    destroy: () => {
      isClosed = true;
      if (ws) ws.close();
    }
  };
}
