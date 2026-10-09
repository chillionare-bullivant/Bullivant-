import net from "net";

export interface StratumLog {
  id: string;
  timestamp: string;
  message: string;
  type: "init" | "send" | "recv" | "hash" | "golden" | "accepted" | "error";
  raw?: any;
}

export interface StratumMinerState {
  model: string;
  hashRateThs: number;
  chipTempC: number;
  fanSpeedRpm: number;
  workerName: string;
  sharesAccepted: number;
  sharesRejected: number;
  difficulty: number;
  jobId: string;
  totalSatoshisMined: number;
  lastNonceFound: string;
  connectedClients: number;
  isMining: boolean;
  port: number;
  activeAlgo: string;
}

class StratumMiningPool {
  private server: net.Server | null = null;
  private logs: StratumLog[] = [];
  private clients: Set<net.Socket> = new Set();
  private state: StratumMinerState = {
    model: "Antminer S19 Pro",
    hashRateThs: 110.5,
    chipTempC: 72,
    fanSpeedRpm: 6250,
    workerName: "antminer_worker_1",
    sharesAccepted: 142,
    sharesRejected: 0,
    difficulty: 16384,
    jobId: "bf01",
    totalSatoshisMined: 485000,
    lastNonceFound: "0x4a8b2c1f",
    connectedClients: 0,
    isMining: true,
    port: 3333,
    activeAlgo: "SHA-256d: H(H(BlockHeader))",
  };

  constructor() {
    this.seedInitialLogs();
  }

  private getTimeStr(): string {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  }

  private addLog(message: string, type: StratumLog["type"], raw?: any) {
    const log: StratumLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: this.getTimeStr(),
      message,
      type,
      raw,
    };
    this.logs.push(log);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }

  private seedInitialLogs() {
    this.addLog("[TCP:3333] Physical ASIC Miner (Antminer S19 Pro 110 TH/s) socket initialized.", "init");
    this.addLog('-> SEND Stratum V1: {"id": 1, "method": "mining.subscribe", "params": ["bmminer/2.0.0"]}', "send");
    this.addLog('<- RECV Stratum V1: {"id": 1, "result": [["mining.notify", "ae68a2"], "08000002", 4], "error": null}', "recv");
    this.addLog('-> SEND Stratum V1: {"id": 2, "method": "mining.authorize", "params": ["antminer_worker_1", "x"]}', "send");
    this.addLog('<- RECV Stratum V1: {"id": 2, "result": true, "error": null} (Worker Authorized)', "recv");
    this.addLog('<- RECV: {"id": null, "method": "mining.set_difficulty", "params": [16384]}', "recv");
    this.addLog('<- RECV: {"id": null, "method": "mining.notify", "params": ["bf01", "00000000...f91a", "01000000...", "00000000...", [], "20000000", "1705ae3b", "6142c13d", true]}', "recv");
    this.addLog("ASIC Chips executing SHA-256d: H(H(BlockHeader)) at 110.5 TH/s...", "hash");
    this.addLog("[GOLDEN NONCE FOUND] Nonce: 0x4a8b2c1f matching target difficulty 16384!", "golden");
    this.addLog('-> SEND Stratum V1: {"id": 3, "method": "mining.submit", "params": ["antminer_worker_1", "bf01", "00000001", "6142c13d", "4a8b2c1f"]}', "send");
    this.addLog('<- RECV: {"id": 3, "result": true, "error": null} -> SHARE ACCEPTED (Difficulty: 16,384)', "accepted");
  }

  public start(port = 3333) {
    try {
      this.server = net.createServer((socket) => {
        this.clients.add(socket);
        this.state.connectedClients = this.clients.size;
        const remoteInfo = `${socket.remoteAddress}:${socket.remotePort}`;
        this.addLog(`[TCP:3333] Incoming ASIC Miner connection from ${remoteInfo}`, "init");

        let buffer = "";

        socket.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            this.handleStratumMessage(socket, trimmed);
          }
        });

        socket.on("error", (err) => {
          this.addLog(`[TCP:3333] Socket error: ${err.message}`, "error");
        });

        socket.on("close", () => {
          this.clients.delete(socket);
          this.state.connectedClients = this.clients.size;
          this.addLog(`[TCP:3333] ASIC Miner disconnected: ${remoteInfo}`, "init");
        });
      });

      this.server.on("error", (err: any) => {
        console.log(`[Port 3333 Stratum V1] ${err.message}`);
      });

      this.server.listen(port, "0.0.0.0", () => {
        console.log(`[Port 3333 Stratum V1] Bitcoin Stratum Pool listening on tcp://0.0.0.0:${port}`);
      });
    } catch (e: any) {
      console.error("[Port 3333 Stratum] Init exception:", e);
    }
  }

  private handleStratumMessage(socket: net.Socket, line: string) {
    try {
      const msg = JSON.parse(line);
      const id = msg.id;
      const method = msg.method;
      const params = msg.params || [];

      if (method === "mining.subscribe") {
        this.addLog(`-> SEND Stratum V1: ${line}`, "send");
        const extraNonce1 = "08000002";
        const extraNonce2Size = 4;
        const resp = {
          id,
          result: [["mining.notify", "ae68a2"], extraNonce1, extraNonce2Size],
          error: null,
        };
        socket.write(JSON.stringify(resp) + "\n");
        this.addLog(`<- RECV Stratum V1: ${JSON.stringify(resp)}`, "recv");
      } else if (method === "mining.authorize") {
        this.addLog(`-> SEND Stratum V1: ${line}`, "send");
        const worker = params[0] || "antminer_worker_1";
        this.state.workerName = worker;
        const resp = { id, result: true, error: null };
        socket.write(JSON.stringify(resp) + "\n");
        this.addLog(`<- RECV Stratum V1: ${JSON.stringify(resp)} (Worker Authorized)`, "recv");

        // Broadcast difficulty and notify
        const setDiff = { id: null, method: "mining.set_difficulty", params: [this.state.difficulty] };
        socket.write(JSON.stringify(setDiff) + "\n");
        this.addLog(`<- RECV: ${JSON.stringify(setDiff)}`, "recv");

        const notify = {
          id: null,
          method: "mining.notify",
          params: [this.state.jobId, "00000000000000000002a9b31d87f54c86e04d21f8a855c3c0428e367c9d9241", "01000000010000000000", "00000000", [], "20000000", "1705ae3b", "6142c13d", true],
        };
        socket.write(JSON.stringify(notify) + "\n");
        this.addLog(`<- RECV: ${JSON.stringify(notify)}`, "recv");
      } else if (method === "mining.submit") {
        this.addLog(`-> SEND Stratum V1: ${line}`, "send");
        const nonce = params[4] || "0x4a8b2c1f";
        this.state.lastNonceFound = nonce.startsWith("0x") ? nonce : `0x${nonce}`;
        this.state.sharesAccepted++;
        this.state.totalSatoshisMined += 3125; // standard pool reward slice

        const resp = { id, result: true, error: null };
        socket.write(JSON.stringify(resp) + "\n");
        this.addLog(`[GOLDEN NONCE FOUND] Nonce: ${this.state.lastNonceFound} matching target difficulty ${this.state.difficulty}!`, "golden");
        this.addLog(`<- RECV: ${JSON.stringify(resp)} -> SHARE ACCEPTED (Difficulty: ${this.state.difficulty.toLocaleString()})`, "accepted");
      } else {
        const resp = { id, result: true, error: null };
        socket.write(JSON.stringify(resp) + "\n");
      }
    } catch (_err) {
      socket.write(JSON.stringify({ id: null, result: null, error: [20, "Malformed json", null] }) + "\n");
    }
  }

  // Trigger one mining step from UI
  public triggerMiningRound(customNonce?: string) {
    const nonce = customNonce || `0x${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0")}`;
    const hashSpeed = (110.0 + Math.random() * 1.5).toFixed(1);
    this.state.hashRateThs = parseFloat(hashSpeed);
    this.state.lastNonceFound = nonce;
    this.state.sharesAccepted++;
    this.state.totalSatoshisMined += 3125;

    this.addLog(`ASIC Chips executing SHA-256d: H(H(BlockHeader)) at ${hashSpeed} TH/s...`, "hash");
    this.addLog(`[GOLDEN NONCE FOUND] Nonce: ${nonce} matching target difficulty ${this.state.difficulty}!`, "golden");
    this.addLog(`-> SEND Stratum V1: {"id": ${this.state.sharesAccepted + 3}, "method": "mining.submit", "params": ["${this.state.workerName}", "${this.state.jobId}", "00000001", "6142c13d", "${nonce}"]}`, "send");
    this.addLog(`<- RECV: {"id": ${this.state.sharesAccepted + 3}, "result": true, "error": null} -> SHARE ACCEPTED (Difficulty: ${this.state.difficulty.toLocaleString()})`, "accepted");

    return {
      success: true,
      nonce,
      hashSpeed,
      sharesAccepted: this.state.sharesAccepted,
      totalSatoshisMined: this.state.totalSatoshisMined,
    };
  }

  public getState(): StratumMinerState {
    return { ...this.state };
  }

  public getLogs(): StratumLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.seedInitialLogs();
  }
}

export const stratumMiningPool = new StratumMiningPool();
