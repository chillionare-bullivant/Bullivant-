import { create247Provider } from "../utils/reconnect.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * BNB Smart Chain (BSC) 24/7 WebSocket Provider
 * Listens for BSC blocks, DEX swaps, and liquidity additions.
 */
const bscWssUrl = process.env.BSC_WSS_URL || "wss://bsc.publicnode.com";

export const bscProvider = create247Provider(bscWssUrl, "BSC-Mainnet", {
  reconnectInterval: 3000,
  onConnect: () => {
    console.log("🟡 [BSC Provider] Connected and ready for BSC block subscriptions");
  },
});
