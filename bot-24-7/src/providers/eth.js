import { create247Provider } from "../utils/reconnect.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Ethereum Mainnet 24/7 WebSocket Provider
 * Uses WSS_RPC_URL from .env or defaults to a high-availability public node.
 */
const ethWssUrl = process.env.WSS_RPC_URL || process.env.ETH_WSS_URL || "wss://ethereum.publicnode.com";

export const ethProvider = create247Provider(ethWssUrl, "ETH-Mainnet", {
  reconnectInterval: 3000,
  onConnect: () => {
    console.log("⚡ [ETH Provider] Ready for block and event subscriptions");
  },
});
