import dotenv from "dotenv";
dotenv.config();

/**
 * 24/7 Resilient Queue Architecture (Rule #2)
 *
 * "Put everything in a Queue - don't process in the listener"
 *
 * Decouples high-throughput event ingestion (1,000s of Transfer/Mint events)
 * from slower I/O tasks (database writes, notifications, flash loan evaluations).
 *
 * If REDIS_URL is present, connects via BullMQ.
 * If Redis is not running, falls back to a high-speed in-memory async queue
 * so your bot NEVER crashes on startup.
 */

const redisUrl = process.env.REDIS_URL;
let mintQueue = null;
let mintWorker = null;

// In-memory queue fallback implementation for zero-dependency resilience
class ResilientInMemoryQueue {
  constructor(name) {
    this.name = name;
    this.queue = [];
    this.handlers = [];
    this.stats = { added: 0, processed: 0, failed: 0 };
    this.isProcessing = false;
  }

  async add(jobName, data) {
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: jobName,
      data,
      timestamp: Date.now(),
    };
    this.queue.push(job);
    this.stats.added++;
    this._processNext();
    return job;
  }

  registerWorker(handler) {
    this.handlers.push(handler);
    this._processNext();
  }

  async _processNext() {
    if (this.isProcessing || this.queue.length === 0 || this.handlers.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      for (const handler of this.handlers) {
        try {
          await handler(job);
          this.stats.processed++;
        } catch (err) {
          this.stats.failed++;
          console.error(`[Queue:${this.name}] Job processing error:`, err.message);
        }
      }
    }
    this.isProcessing = false;
  }

  getStats() {
    return {
      ...this.stats,
      waiting: this.queue.length,
      mode: "in-memory-fallback",
    };
  }
}

// Instantiate Queue
let BullMQQueue = null;
let BullMQWorker = null;

if (redisUrl) {
  try {
    const bullmq = await import("bullmq");
    BullMQQueue = bullmq.Queue;
    BullMQWorker = bullmq.Worker;
    const connection = { url: redisUrl };
    mintQueue = new BullMQQueue("mints", { connection });
    console.log("⚡ [Queue Service] BullMQ connected to Redis at", redisUrl);
  } catch (err) {
    console.warn("⚠️ [Queue Service] Redis/BullMQ connection failed, falling back to in-memory queue:", err.message);
    mintQueue = new ResilientInMemoryQueue("mints");
  }
} else {
  console.log("ℹ️ [Queue Service] Running with built-in Resilient InMemory Queue (set REDIS_URL to enable BullMQ Redis)");
  mintQueue = new ResilientInMemoryQueue("mints");
}

export { mintQueue };

/**
 * Starts the worker processing queue jobs in the background.
 */
export async function startMintWorker(processCallback) {
  if (mintQueue instanceof ResilientInMemoryQueue) {
    mintQueue.registerWorker(async (job) => {
      if (processCallback) await processCallback(job.data);
    });
    return { mode: "in-memory" };
  }

  try {
    if (!BullMQWorker) {
      const bullmq = await import("bullmq");
      BullMQWorker = bullmq.Worker;
    }

    mintWorker = new BullMQWorker(
      "mints",
      async (job) => {
        if (processCallback) await processCallback(job.data);
      },
      { connection: { url: redisUrl }, concurrency: 5 }
    );

    mintWorker.on("completed", (job) => {
      console.log(`[BullMQ Worker] Mint job ${job.id} processed successfully`);
    });

    mintWorker.on("failed", (job, err) => {
      console.error(`[BullMQ Worker] Mint job ${job.id} failed:`, err.message);
    });

    return mintWorker;
  } catch (err) {
    console.error("[Queue Service] Failed to initialize BullMQ Worker:", err.message);
  }
}
