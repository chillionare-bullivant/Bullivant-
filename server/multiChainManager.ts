import crypto from "crypto";
import { ethers } from "ethers";
import { btcManager } from "./btcManager.js";

// ==========================================
// 1. CUSTOM BLOCKCHAIN IN NODE.JS
// ==========================================

export interface CustomBlockData {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  miningDurationMs?: number;
}

export class CustomBlock {
  public index: number;
  public timestamp: number;
  public data: any;
  public previousHash: string;
  public hash: string;
  public nonce: number;
  public difficulty: number;
  public miningDurationMs: number = 0;

  constructor(index: number, timestamp: number, data: any, previousHash = "", difficulty = 2) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  public calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data) +
          this.nonce +
          this.difficulty
      )
      .digest("hex");
  }

  public mineBlock(difficulty: number): { hash: string; nonce: number; durationMs: number } {
    this.difficulty = difficulty;
    const target = "0".repeat(difficulty);
    const start = Date.now();
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    this.miningDurationMs = Date.now() - start;
    return {
      hash: this.hash,
      nonce: this.nonce,
      durationMs: this.miningDurationMs,
    };
  }
}

export class CustomBlockchain {
  public chain: CustomBlock[] = [];
  public difficulty: number = 2;

  constructor() {
    this.reset();
  }

  public reset(): void {
    const genesis = new CustomBlock(
      0,
      1710000000000,
      { message: "Genesis Block: Node.js Cryptographic Ledger Initialized", network: "NodeChain-P2P" },
      "0".repeat(64),
      2
    );
    genesis.mineBlock(2);
    this.chain = [genesis];

    // Seed 2 initial demo blocks
    this.addBlock({ sender: "Satoshi", recipient: "Hal Finney", amount: 10, note: "P2P Payment via Node.js" }, 2);
    this.addBlock({ sender: "Alice", recipient: "Bob", amount: 2.5, note: "Smart state execution" }, 2);
  }

  public getLatestBlock(): CustomBlock {
    return this.chain[this.chain.length - 1];
  }

  public addBlock(data: any, difficulty = this.difficulty): CustomBlock {
    const prevBlock = this.getLatestBlock();
    const newBlock = new CustomBlock(
      this.chain.length,
      Date.now(),
      data,
      prevBlock.hash,
      difficulty
    );
    newBlock.mineBlock(difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  public tamperBlock(index: number, newData: any): { success: boolean; message: string } {
    if (index < 0 || index >= this.chain.length) {
      return { success: false, message: `Block index ${index} out of bounds` };
    }
    // Modify data without recalculating hash/nonce to simulate unauthorized tampering
    this.chain[index].data = newData;
    return {
      success: true,
      message: `Block #${index} data secretly modified. Subsequent blocks and cryptographic hashes are now invalid!`,
    };
  }

  public isChainValid(): { isValid: boolean; errorIndex: number | null; reason?: string } {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 1. Verify block hash calculation
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return {
          isValid: false,
          errorIndex: i,
          reason: `Block #${i} hash mismatch: recalculation failed. Data has been tampered with!`,
        };
      }

      // 2. Verify previous hash pointer
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          isValid: false,
          errorIndex: i,
          reason: `Block #${i} previousHash pointer does not match Block #${i - 1} hash! Broken chain link.`,
        };
      }

      // 3. Verify Proof-of-Work difficulty target
      const target = "0".repeat(currentBlock.difficulty);
      if (currentBlock.hash.substring(0, currentBlock.difficulty) !== target) {
        return {
          isValid: false,
          errorIndex: i,
          reason: `Block #${i} does not satisfy Proof-of-Work target of ${currentBlock.difficulty} leading zeroes!`,
        };
      }
    }
    return { isValid: true, errorIndex: null };
  }
}

// ==========================================
// 2. MULTI-CHAIN PIPELINE (BITCOIN & ETHEREUM)
// ==========================================

export async function fetchMultiChainStatus() {
  // 1. Bitcoin Data (via internal manager / Esplora fallback)
  const btcInfo = await btcManager.getBlockchainInfo({ network: "mainnet" });
  const btcFees = await btcManager.getFeeRates("mainnet");

  // 2. Ethereum Data (via public JSON-RPC provider)
  let ethData: {
    blockNumber: number;
    gasPriceGwei: string;
    network: string;
    status: "connected" | "fallback";
    latencyMs: number;
  } = {
    blockNumber: 21915830,
    gasPriceGwei: "12.4",
    network: "mainnet",
    status: "fallback",
    latencyMs: 85,
  };

  const ethStart = Date.now();
  try {
    // Standard public RPC with quick timeout
    const provider = new ethers.JsonRpcProvider("https://rpc.flashbots.net");
    const [latestBlock, feeData] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
    ]);

    const gasInGwei = feeData.gasPrice
      ? (Number(feeData.gasPrice) / 1e9).toFixed(2)
      : "1.2";

    ethData = {
      blockNumber: latestBlock,
      gasPriceGwei: gasInGwei,
      network: "Ethereum Mainnet (ChainID 1)",
      status: "connected",
      latencyMs: Date.now() - ethStart,
    };
  } catch (_ethErr) {
    // Graceful fallback with realistic live baseline
    ethData.latencyMs = Date.now() - ethStart;
  }

  return {
    timestamp: new Date().toISOString(),
    bitcoin: {
      network: "mainnet",
      blockHeight: btcInfo.blocks,
      bestBlockHash: btcInfo.bestblockhash,
      fastestFeeSatVb: btcFees.fastestFee,
      halfHourFeeSatVb: btcFees.halfHourFee,
      hourFeeSatVb: btcFees.hourFee,
      accountingModel: "UTXO (Unspent Transaction Outputs)",
      scripting: "Bitcoin Script (Stateless, Non-Turing Complete)",
      blockTime: "~10 minutes",
      currentReward: "3.125 BTC per block (post-April 2024 halving)",
      latencyMs: btcInfo.latencyMs,
    },
    ethereum: {
      network: ethData.network,
      blockHeight: ethData.blockNumber,
      gasPriceGwei: ethData.gasPriceGwei,
      accountingModel: "Account/Balance Model (State Trie)",
      scripting: "EVM (Stateful, Turing Complete Smart Contracts)",
      blockTime: "~12 seconds",
      finality: "2 Epochs (~12.8 minutes)",
      status: ethData.status,
      latencyMs: ethData.latencyMs,
    },
  };
}

// ==========================================
// 3. MULTI-CHAIN HD WALLET DERIVATION
// ==========================================

export function generateMultiChainHDWallet(customMnemonic?: string) {
  let mnemonicPhrase = customMnemonic?.trim();
  if (!mnemonicPhrase) {
    const randomWallet = ethers.Wallet.createRandom();
    mnemonicPhrase = randomWallet.mnemonic?.phrase || "";
  }

  // Derive master node from mnemonic
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonicPhrase);

  // 1. Ethereum Derivation: BIP-44 standard m/44'/60'/0'/0/0
  const ethWallet = hdNode.derivePath("m/44'/60'/0'/0/0");

  // 2. Bitcoin Derivation: BIP-84 Native SegWit standard m/84'/0'/0'/0/0
  // Generate deterministic Bitcoin keys using BIP-32 seed representation
  const btcPath = "m/84'/0'/0'/0/0";
  const btcChild = hdNode.derivePath(btcPath);

  // Generate valid P2WPKH Bech32 address from derived compressed public key
  const pubKeyBytes = Buffer.from(btcChild.publicKey.slice(2), "hex");
  const sha = crypto.createHash("sha256").update(pubKeyBytes).digest();
  const ripemd160 = crypto.createHash("ripemd160").update(sha).digest();

  // Encode witness program to Bech32 bc1q format
  const btcAddress = encodeBech32("bc", 0, ripemd160);

  // Convert private key to WIF format
  const privKeyBuf = Buffer.from(btcChild.privateKey.slice(2), "hex");
  const btcWif = encodeWif(privKeyBuf, 0x80);

  return {
    mnemonic: mnemonicPhrase,
    wordCount: mnemonicPhrase.split(" ").length,
    ethereum: {
      derivationPath: "m/44'/60'/0'/0/0 (BIP-44)",
      address: ethWallet.address,
      publicKey: ethWallet.publicKey,
      privateKey: ethWallet.privateKey,
      network: "Ethereum Mainnet (EVM)",
    },
    bitcoin: {
      derivationPath: "m/84'/0'/0'/0/0 (BIP-84 Native SegWit)",
      address: btcAddress,
      publicKey: btcChild.publicKey,
      privateKeyWif: btcWif,
      addressType: "P2WPKH (Native SegWit)",
      feeEfficiency: "30-40% lower fees than Legacy P2PKH",
    },
    securityRules: [
      "Client-Side Rule: Never transmit raw seed phrase or private keys over plain HTTP.",
      "Deterministic Derivation: Both BTC and ETH addresses are deterministically derived from the exact same master 12-word mnemonic.",
      "SegWit Advantage: BIP-84 produces Bech32 (bc1q...) addresses with discount witness data weights.",
    ],
  };
}

// ==========================================
// 4. CUSTODIAL WALLET BANKING ENGINE
// ==========================================

export interface CustodialUser {
  userId: number;
  email: string;
  btcBalance: number;
  ethBalance: number;
  btcDepositAddress: string;
  ethDepositAddress: string;
}

export interface CustodialState {
  hotWallet: {
    btc: number;
    eth: number;
    description: string;
    sharePercent: string;
  };
  coldWallet: {
    btc: number;
    eth: number;
    description: string;
    sharePercent: string;
  };
  users: CustodialUser[];
  processedTxs: string[];
  recentLedgerLogs: Array<{
    id: string;
    timestamp: string;
    type: "DEPOSIT_CREDIT" | "WITHDRAWAL_BROADCAST" | "SWEEP_TRANSFERRED" | "RATE_LIMIT_FLAGGED";
    currency: "BTC" | "ETH";
    amount: number;
    userId: number;
    txHash: string;
    sqlStatement: string;
    status: "COMMITTED" | "FLAGGED_FOR_MANUAL_REVIEW" | "REVERTED";
  }>;
}

class CustodialWalletEngine {
  private state: CustodialState = {
    hotWallet: {
      btc: 0.35,
      eth: 7.2,
      description: "Node.js Controlled Instant Withdrawal Liquidity Pool",
      sharePercent: "7.1%",
    },
    coldWallet: {
      btc: 4.65,
      eth: 94.5,
      description: "Institutional Multi-Sig / Hardware Vault (Untouchable via Server)",
      sharePercent: "92.9%",
    },
    users: [
      {
        userId: 101,
        email: "alice@fintech-trader.io",
        btcBalance: 0.085,
        ethBalance: 1.45,
        btcDepositAddress: "bc1q9v7x2k8l5p4y3n6w0m1j8d7g5s2a4e9c3r",
        ethDepositAddress: "0x71C63B576023c39363528617a6ecB2384a27471B",
      },
      {
        userId: 102,
        email: "bob@hedgefund-alpha.com",
        btcBalance: 0.22,
        ethBalance: 3.8,
        btcDepositAddress: "bc1q5f9k3p2l8y7n4w1m6j0d9g4s7a2e5c8r0v",
        ethDepositAddress: "0x28C6c06298d514Db089934071355E5743bf21d60",
      },
    ],
    processedTxs: ["tx_mock_deposit_001", "tx_mock_deposit_002"],
    recentLedgerLogs: [
      {
        id: "log_init_01",
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        type: "DEPOSIT_CREDIT",
        currency: "BTC",
        amount: 0.05,
        userId: 101,
        txHash: "7b13e9a0c492b45129ff2d8102bbbc9192485e9240bf12918451bdf821739c4a",
        sqlStatement: "BEGIN; SELECT * FROM processed_txs WHERE hash = '7b13...' FOR UPDATE; UPDATE balances SET amount = amount + 0.05 WHERE user_id = 101 AND currency = 'BTC'; COMMIT;",
        status: "COMMITTED",
      },
    ],
  };

  public getState(): CustodialState {
    return this.state;
  }

  /**
   * Process incoming deposit webhook (simulating automated webhook listener)
   */
  public processDepositWebhook(payload: {
    address: string;
    amount: number;
    currency: "BTC" | "ETH";
    txHash: string;
    confirmations: number;
    hmacSignature?: string;
  }) {
    const requiredConfs = payload.currency === "BTC" ? 3 : 12;

    // 1. Verify Confirmations threshold
    if (payload.confirmations < requiredConfs) {
      return {
        success: false,
        error: `Insufficient confirmations. Received ${payload.confirmations}, requires >= ${requiredConfs} for ${payload.currency} finality.`,
        action: "REVERTED_WAITING_MORE_CONFIRMATIONS",
      };
    }

    // 2. Match deposit destination to registered user
    const user = this.state.users.find((u) =>
      payload.currency === "BTC"
        ? u.btcDepositAddress.toLowerCase() === payload.address.toLowerCase()
        : u.ethDepositAddress.toLowerCase() === payload.address.toLowerCase()
    );

    if (!user) {
      return {
        success: false,
        error: "Unrecognized deposit address. Not mapped to any custodial user profile.",
        action: "REVERTED_UNKNOWN_DESTINATION",
      };
    }

    // 3. Idempotency Check: Prevent duplicate crediting
    if (this.state.processedTxs.includes(payload.txHash)) {
      return {
        success: false,
        error: `Transaction ${payload.txHash} has already been credited! Idempotency guard triggered.`,
        action: "REVERTED_DUPLICATE_TX",
      };
    }

    // 4. Atomic Database Transaction: Credit off-chain balance
    if (payload.currency === "BTC") {
      user.btcBalance += payload.amount;
      this.state.hotWallet.btc += payload.amount;
    } else {
      user.ethBalance += payload.amount;
      this.state.hotWallet.eth += payload.amount;
    }

    this.state.processedTxs.push(payload.txHash);

    const sql = `BEGIN;
SELECT * FROM processed_txs WHERE hash = '${payload.txHash.slice(0, 16)}...' FOR UPDATE;
UPDATE balances SET amount = amount + ${payload.amount} WHERE user_id = ${user.userId} AND currency = '${payload.currency}';
INSERT INTO processed_txs (hash, user_id) VALUES ('${payload.txHash.slice(0, 16)}...', ${user.userId});
COMMIT;`;

    this.state.recentLedgerLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: "DEPOSIT_CREDIT",
      currency: payload.currency,
      amount: payload.amount,
      userId: user.userId,
      txHash: payload.txHash,
      sqlStatement: sql,
      status: "COMMITTED",
    });

    return {
      success: true,
      message: `Deposit of ${payload.amount} ${payload.currency} credited successfully to User #${user.userId} (${user.email})`,
      userId: user.userId,
      newBalance: payload.currency === "BTC" ? user.btcBalance : user.ethBalance,
      sqlTransaction: sql,
    };
  }

  /**
   * Process withdrawal request with velocity rate limits & hot wallet broadcast
   */
  public processWithdrawal(payload: {
    userId: number;
    destinationAddress: string;
    amount: number;
    currency: "BTC" | "ETH";
  }) {
    const user = this.state.users.find((u) => u.userId === Number(payload.userId));
    if (!user) {
      return { success: false, error: "User record not found." };
    }

    const currentBal = payload.currency === "BTC" ? user.btcBalance : user.ethBalance;
    if (currentBal < payload.amount) {
      return {
        success: false,
        error: `Insufficient off-chain balance. User has ${currentBal.toFixed(4)} ${payload.currency}, requested ${payload.amount} ${payload.currency}.`,
      };
    }

    // Velocity & Institutional Threshold Guard
    const maxThreshold = payload.currency === "BTC" ? 1.0 : 10.0;
    if (payload.amount >= maxThreshold) {
      const sqlReview = `UPDATE withdrawal_requests SET status = 'MANUAL_REVIEW_FLAGGED' WHERE user_id = ${user.userId} AND amount >= ${maxThreshold};`;
      this.state.recentLedgerLogs.unshift({
        id: `flag_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: "RATE_LIMIT_FLAGGED",
        currency: payload.currency,
        amount: payload.amount,
        userId: user.userId,
        txHash: "PENDING_APPROVAL",
        sqlStatement: sqlReview,
        status: "FLAGGED_FOR_MANUAL_REVIEW",
      });

      return {
        success: false,
        error: `Velocity Guard Triggered: Withdrawal of ${payload.amount} ${payload.currency} exceeds threshold (>${maxThreshold} ${payload.currency}). Sent to institutional multi-sig queue for admin verification.`,
        action: "FLAGGED_FOR_MANUAL_APPROVAL",
      };
    }

    // Verify Hot Wallet Liquidity
    const hotBal = payload.currency === "BTC" ? this.state.hotWallet.btc : this.state.hotWallet.eth;
    if (hotBal < payload.amount) {
      return {
        success: false,
        error: `Hot wallet requires rebalance from Cold Storage! Available hot liquidity: ${hotBal} ${payload.currency}.`,
      };
    }

    // Deduct user balance
    if (payload.currency === "BTC") {
      user.btcBalance -= payload.amount;
      this.state.hotWallet.btc -= payload.amount;
    } else {
      user.ethBalance -= payload.amount;
      this.state.hotWallet.eth -= payload.amount;
    }

    const broadcastTxHash = crypto.randomBytes(32).toString("hex");
    const sql = `BEGIN;
SELECT amount FROM balances WHERE user_id = ${user.userId} AND currency = '${payload.currency}' FOR UPDATE;
UPDATE balances SET amount = amount - ${payload.amount} WHERE user_id = ${user.userId} AND currency = '${payload.currency}';
COMMIT;`;

    this.state.recentLedgerLogs.unshift({
      id: `wth_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: "WITHDRAWAL_BROADCAST",
      currency: payload.currency,
      amount: payload.amount,
      userId: user.userId,
      txHash: broadcastTxHash,
      sqlStatement: sql,
      status: "COMMITTED",
    });

    return {
      success: true,
      message: `Withdrawal of ${payload.amount} ${payload.currency} broadcast on-chain via Central Hot Wallet!`,
      txHash: broadcastTxHash,
      newBalance: payload.currency === "BTC" ? user.btcBalance : user.ethBalance,
      hotWalletRemaining: payload.currency === "BTC" ? this.state.hotWallet.btc : this.state.hotWallet.eth,
      sqlTransaction: sql,
    };
  }

  /**
   * Sweep funds from deposit addresses to Hot/Cold vaults
   */
  public triggerSweep() {
    const btcSwept = 0.05;
    const ethSwept = 0.5;

    this.state.hotWallet.btc += btcSwept * 0.2;
    this.state.coldWallet.btc += btcSwept * 0.8;

    this.state.hotWallet.eth += ethSwept * 0.2;
    this.state.coldWallet.eth += ethSwept * 0.8;

    const sqlSweep = `INSERT INTO vault_sweeps (btc_swept, eth_swept, timestamp) VALUES (${btcSwept}, ${ethSwept}, NOW());`;

    this.state.recentLedgerLogs.unshift({
      id: `swp_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: "SWEEP_TRANSFERRED",
      currency: "BTC",
      amount: btcSwept,
      userId: 101,
      txHash: crypto.randomBytes(32).toString("hex"),
      sqlStatement: sqlSweep,
      status: "COMMITTED",
    });

    return {
      success: true,
      btcSwept,
      ethSwept,
      newHotBtc: this.state.hotWallet.btc,
      newColdBtc: this.state.coldWallet.btc,
    };
  }
}

// Helpers for Bitcoin encoding
function encodeBech32(hrp: string, version: number, data: Buffer): string {
  const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const words = [version, ...toWords(data)];
  const checksum = createChecksum(hrp, words);
  return hrp + "1" + [...words, ...checksum].map((d) => ALPHABET.charAt(d)).join("");
}

function toWords(bytes: Buffer): number[] {
  let value = 0;
  let bits = 0;
  const maxv = (1 << 5) - 1;
  const result: number[] = [];
  for (let i = 0; i < bytes.length; ++i) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result.push((value >> bits) & maxv);
    }
  }
  if (bits > 0) {
    result.push((value << (5 - bits)) & maxv);
  }
  return result;
}

function createChecksum(hrp: string, words: number[]): number[] {
  const polymod = (values: number[]) => {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const v of values) {
      const top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ v;
      for (let i = 0; i < 5; i++) {
        chk ^= (top >> i) & 1 ? GEN[i] : 0;
      }
    }
    return chk;
  };

  const hrpExpand = (h: string) => {
    const ret: number[] = [];
    for (let i = 0; i < h.length; i++) ret.push(h.charCodeAt(i) >> 5);
    ret.push(0);
    for (let i = 0; i < h.length; i++) ret.push(h.charCodeAt(i) & 31);
    return ret;
  };

  const values = hrpExpand(hrp).concat(words).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const ret: number[] = [];
  for (let p = 0; p < 6; ++p) {
    ret.push((mod >> (5 * (5 - p))) & 31);
  }
  return ret;
}

function encodeWif(privateKey: Buffer, versionPrefix: number): string {
  const extended = Buffer.concat([Buffer.from([versionPrefix]), privateKey, Buffer.from([0x01])]);
  const hash1 = crypto.createHash("sha256").update(extended).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  const checksum = hash2.slice(0, 4);
  const full = Buffer.concat([extended, checksum]);
  return toBase58(full);
}

function toBase58(buffer: Buffer): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += buffer[i];
    let carry = 0;
    for (let j = 0; j < digits.length; ++j) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let str = "";
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) str += ALPHABET[0];
  for (let i = digits.length - 1; i >= 0; i--) str += ALPHABET[digits[i]];
  return str;
}

export const customBlockchain = new CustomBlockchain();
export const custodialEngine = new CustodialWalletEngine();
