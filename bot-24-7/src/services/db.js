/**
 * 24/7 Lightweight Storage Service
 * Persists blocks, mint events, and DEX arbitrage records.
 * Can be plugged into SQLite, PostgreSQL, or Firestore.
 */

class BotDatabase {
  constructor() {
    this.mints = [];
    this.blocks = [];
    this.transfers = [];
    this.maxHistory = 1000;
  }

  async saveMint(mintRecord) {
    const record = {
      id: `mint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...mintRecord,
    };
    this.mints.unshift(record);
    if (this.mints.length > this.maxHistory) {
      this.mints.pop();
    }
    return record;
  }

  async saveBlock(chain, blockNumber, txCount = 0) {
    const record = {
      chain,
      blockNumber,
      txCount,
      timestamp: Date.now(),
    };
    this.blocks.unshift(record);
    if (this.blocks.length > this.maxHistory) {
      this.blocks.pop();
    }
    return record;
  }

  async saveTransfer(transferRecord) {
    const record = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...transferRecord,
    };
    this.transfers.unshift(record);
    if (this.transfers.length > this.maxHistory) {
      this.transfers.pop();
    }
    return record;
  }

  getRecentMints(limit = 20) {
    return this.mints.slice(0, limit);
  }

  getRecentBlocks(chain = null, limit = 20) {
    if (!chain) return this.blocks.slice(0, limit);
    return this.blocks.filter((b) => b.chain === chain).slice(0, limit);
  }

  getStats() {
    return {
      totalMints: this.mints.length,
      totalBlocks: this.blocks.length,
      totalTransfers: this.transfers.length,
      latestEthBlock: this.blocks.find((b) => b.chain === "ETH")?.blockNumber || null,
      latestBscBlock: this.blocks.find((b) => b.chain === "BSC")?.blockNumber || null,
    };
  }
}

export const db = new BotDatabase();
