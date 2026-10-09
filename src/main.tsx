import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Exponential Backoff WebSocket Reconnection Engine
 * Implements exponential backoff: delay = min(maxDelay, baseDelay * 2^attempt) + jitter
 */
export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxRetries: number;
  jitterRatio: number;
}

export interface ReconnectState {
  attempt: number;
  isReconnecting: boolean;
  nextDelayMs: number;
  lastError: string | null;
  status: "idle" | "reconnecting" | "connected" | "exhausted";
}

const DEFAULT_CONFIG: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  maxRetries: 10,
  jitterRatio: 0.2, // 20% randomized jitter to avoid thundering herd
};

export class WebSocketReconnectionManager {
  private config: BackoffConfig;
  private attempts: Map<string, number> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private activeSockets: Map<string, WebSocket> = new Map();

  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public calculateBackoff(attempt: number): number {
    const exponential = this.config.baseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(this.config.maxDelayMs, exponential);
    // Apply randomized jitter: ± (jitterRatio * capped)
    const jitter = (Math.random() * 2 - 1) * this.config.jitterRatio * capped;
    return Math.max(this.config.baseDelayMs, Math.round(capped + jitter));
  }

  public scheduleReconnect(
    url: string,
    onReconnect: () => void,
    protocols?: string | string[]
  ): number | null {
    const currentAttempt = (this.attempts.get(url) || 0) + 1;
    this.attempts.set(url, currentAttempt);

    if (currentAttempt > this.config.maxRetries) {
      console.warn(
        `[WebSocketReconnector] Max reconnection retries (${this.config.maxRetries}) reached for: ${url}`
      );
      this.dispatchState(url, {
        attempt: currentAttempt,
        isReconnecting: false,
        nextDelayMs: 0,
        lastError: `Max retries (${this.config.maxRetries}) exceeded`,
        status: "exhausted",
      });
      return null;
    }

    const delay = this.calculateBackoff(currentAttempt - 1);

    this.dispatchState(url, {
      attempt: currentAttempt,
      isReconnecting: true,
      nextDelayMs: delay,
      lastError: null,
      status: "reconnecting",
    });

    console.info(
      `[WebSocketReconnector] Connection lost for ${url}. Reconnecting in ${delay}ms (Attempt ${currentAttempt}/${this.config.maxRetries})...`
    );

    // Clear existing timer if any
    const existingTimer = this.timers.get(url);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.timers.delete(url);
      try {
        onReconnect();
      } catch (err: any) {
        console.warn(`[WebSocketReconnector] Reconnect attempt failed for ${url}:`, err);
      }
    }, delay);

    this.timers.set(url, timer);
    return delay;
  }

  public resetAttempts(url: string) {
    this.attempts.delete(url);
    const timer = this.timers.get(url);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(url);
    }
    this.dispatchState(url, {
      attempt: 0,
      isReconnecting: false,
      nextDelayMs: 0,
      lastError: null,
      status: "connected",
    });
  }

  public createResilientWebSocket(
    url: string,
    protocols?: string | string[],
    handlers?: {
      onOpen?: (ev: Event) => void;
      onMessage?: (ev: MessageEvent) => void;
      onError?: (ev: Event) => void;
      onClose?: (ev: CloseEvent) => void;
    }
  ): WebSocket {
    const connect = (): WebSocket => {
      const ws = new WebSocket(url, protocols);
      this.activeSockets.set(url, ws);

      ws.addEventListener("open", (ev) => {
        this.resetAttempts(url);
        handlers?.onOpen?.(ev);
      });

      ws.addEventListener("message", (ev) => {
        handlers?.onMessage?.(ev);
      });

      ws.addEventListener("error", (ev) => {
        handlers?.onError?.(ev);
      });

      ws.addEventListener("close", (ev) => {
        handlers?.onClose?.(ev);
        // Auto-reconnect if not closed cleanly (code 1000 is clean shutdown)
        if (ev.code !== 1000) {
          this.scheduleReconnect(
            url,
            () => {
              connect();
            },
            protocols
          );
        }
      });

      return ws;
    };

    return connect();
  }

  private dispatchState(url: string, state: ReconnectState) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ws:reconnection_state", {
          detail: { url, ...state, timestamp: Date.now() },
        })
      );
    }
  }
}

// Global singleton instance for application-wide reconnection
export const wsReconnectionManager = new WebSocketReconnectionManager();

// Setup global WebSocket listener with exponential backoff
if (typeof window !== "undefined") {
  (window as any).__wsReconnectionManager = wsReconnectionManager;

  // Intercept and schedule exponential backoff reconnections for dropped WebSocket connections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.message || String(reason))) || "";
    if (
      msg.includes("WebSocket closed without opened") ||
      msg.includes("[vite]") ||
      msg.includes("failed to connect to websocket") ||
      msg.includes("WebSocket connection to")
    ) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const targetUrl = `${protocol}//${window.location.host}/`;
      wsReconnectionManager.scheduleReconnect(targetUrl, () => {
        // Re-ping server health check to verify endpoint liveness
        fetch("/api/health", { method: "GET" }).catch(() => {});
      });
    } else if (
      msg.includes("Document is not focused") ||
      msg.includes("NotAllowedError") ||
      msg.includes("Clipboard")
    ) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = (event && (event.message || (event.error && event.error.message) || String(event))) || "";
    if (
      msg.includes("WebSocket closed without opened") ||
      msg.includes("[vite]") ||
      msg.includes("failed to connect to websocket") ||
      msg.includes("WebSocket connection to")
    ) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const targetUrl = `${protocol}//${window.location.host}/`;
      wsReconnectionManager.scheduleReconnect(targetUrl, () => {
        fetch("/api/health", { method: "GET" }).catch(() => {});
      });
    } else if (
      msg.includes("Document is not focused") ||
      msg.includes("NotAllowedError") ||
      msg.includes("Clipboard")
    ) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
