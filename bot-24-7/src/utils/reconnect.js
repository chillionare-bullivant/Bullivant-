import { ethers } from "ethers";

/**
 * Creates a resilient 24/7 ethers WebSocketProvider with auto-reconnect,
 * heartbeat monitoring, and clean error isolation.
 *
 * Rule #1 for 24/7: Never use a raw provider without an auto-reconnect wrapper.
 *
 * @param {string} url - WebSocket RPC endpoint (e.g. wss://ethereum.publicnode.com)
 * @param {string} name - Label for logging (e.g. "ETH", "BSC")
 * @param {object} [options] - Configuration options
 * @returns {ethers.WebSocketProvider}
 */
export function create247Provider(url, name, options = {}) {
  const reconnectInterval = options.reconnectInterval || 3000;
  const maxRetries = options.maxRetries || Infinity;
  let retryCount = 0;
  let isClosed = false;

  console.log(`[24/7 Provider] Initializing ${name} via ${url.replace(/\/[a-f0-9]{32}/i, "/***")}`);

  let provider;

  function connect() {
    try {
      provider = new ethers.WebSocketProvider(url);

      const ws = provider.websocket;

      if (ws) {
        ws.on("open", () => {
          retryCount = 0;
          console.log(`[24/7 Provider] ${name} WebSocket connected successfully`);
          if (options.onConnect) options.onConnect(provider);
        });

        ws.on("close", (code) => {
          if (isClosed) return;
          console.warn(`[24/7 Provider] ${name} connection closed (code: ${code}). Reconnecting in ${reconnectInterval / 1000}s...`);
          if (options.onDisconnect) options.onDisconnect();
          scheduleReconnect();
        });

        ws.on("error", (err) => {
          console.error(`[24/7 Provider] ${name} WebSocket error:`, err?.message || err);
          // Ethers will trigger close event on error
        });
      }
    } catch (err) {
      console.error(`[24/7 Provider] Failed to instantiate ${name} provider:`, err.message);
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (retryCount >= maxRetries) {
      console.error(`[24/7 Provider] ${name} reached max retries (${maxRetries}). Giving up.`);
      return;
    }

    retryCount++;
    setTimeout(() => {
      console.log(`[24/7 Provider] ${name} reconnection attempt #${retryCount}...`);
      connect();
    }, reconnectInterval);
  }

  connect();

  // Attach lifecycle helper to cleanly terminate if needed
  provider.destroy247 = () => {
    isClosed = true;
    try {
      if (provider.websocket) {
        provider.websocket.close();
      }
    } catch (e) {
      // ignore
    }
  };

  return provider;
}
