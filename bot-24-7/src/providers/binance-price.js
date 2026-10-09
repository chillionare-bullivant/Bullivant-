import WebSocket from "ws";

/**
 * 24/7 Real-Time Price Stream via Binance Combined WebSocket
 * Tracks BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT.
 * Automatically reconnects within 2s if the stream drops.
 *
 * @param {Function} onPrice - Callback with { symbol, price, timestamp, raw }
 */
export function start247PriceStream(onPrice) {
  const STREAM_URL = "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/bnbusdt@trade";
  let ws = null;
  let isTerminated = false;

  function connect() {
    if (isTerminated) return;
    console.log("[24/7 Price WS] Connecting to Binance multi-stream...");

    try {
      ws = new WebSocket(STREAM_URL);

      ws.on("open", () => {
        console.log("💹 [24/7 Price WS] Connected to Binance stream (BTC, ETH, SOL, BNB)");
      });

      ws.on("message", (data) => {
        try {
          const payload = JSON.parse(data.toString());
          // Binance trade stream payload format:
          // { e: 'trade', s: 'BTCUSDT', p: '63420.50', q: '0.015', T: 167... }
          if (payload.s && payload.p) {
            const price = parseFloat(payload.p);
            if (onPrice) {
              onPrice({
                symbol: payload.s,
                price: price,
                quantity: parseFloat(payload.q || "0"),
                timestamp: payload.T || Date.now(),
              });
            }
          }
        } catch (err) {
          // ignore parsing glitch
        }
      });

      ws.on("close", () => {
        if (isTerminated) return;
        console.warn("[24/7 Price WS] Stream closed. Reconnecting in 2s...");
        setTimeout(connect, 2000);
      });

      ws.on("error", (err) => {
        console.error("[24/7 Price WS] Stream error:", err.message);
      });
    } catch (err) {
      console.error("[24/7 Price WS] Failed to create WebSocket:", err.message);
      setTimeout(connect, 2000);
    }
  }

  connect();

  return {
    stop: () => {
      isTerminated = true;
      if (ws) ws.close();
    }
  };
}
