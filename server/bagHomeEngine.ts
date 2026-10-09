import crypto from "crypto";
import { ethers } from "ethers";

export type SupportedNetwork = "base" | "arbitrum" | "polygon" | "optimism" | "ethereum";

export interface NetworkProfile {
  id: SupportedNetwork;
  name: string;
  type: "Layer 2 Rollup (OP Stack)" | "Layer 2 Rollup (Nitro)" | "EVM Sidechain" | "Layer 1 Mainnet";
  nativeToken: "ETH" | "POL";
  tokenPriceUsd: number;
  averageGasUsd: number;
  averageGasNative: number;
  recommendedGasFloatUsd: number; // $15 - $30
  recommendedSweepThresholdUsd: number; // e.g. $20
}

export const NETWORK_PROFILES: Record<SupportedNetwork, NetworkProfile> = {
  base: {
    id: "base",
    name: "Base (Coinbase L2)",
    type: "Layer 2 Rollup (OP Stack)",
    nativeToken: "ETH",
    tokenPriceUsd: 2200,
    averageGasUsd: 0.002,
    averageGasNative: 0.000001,
    recommendedGasFloatUsd: 18.0, // ~0.008 ETH
    recommendedSweepThresholdUsd: 20.0, // ~0.009 ETH
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    type: "Layer 2 Rollup (Nitro)",
    nativeToken: "ETH",
    tokenPriceUsd: 2200,
    averageGasUsd: 0.015,
    averageGasNative: 0.000007,
    recommendedGasFloatUsd: 22.0, // ~0.01 ETH
    recommendedSweepThresholdUsd: 25.0, // ~0.011 ETH
  },
  polygon: {
    id: "polygon",
    name: "Polygon PoS",
    type: "EVM Sidechain",
    nativeToken: "POL",
    tokenPriceUsd: 0.40,
    averageGasUsd: 0.004,
    averageGasNative: 0.01,
    recommendedGasFloatUsd: 20.0, // 50 POL
    recommendedSweepThresholdUsd: 20.0, // 50 POL
  },
  optimism: {
    id: "optimism",
    name: "OP Mainnet",
    type: "Layer 2 Rollup (OP Stack)",
    nativeToken: "ETH",
    tokenPriceUsd: 2200,
    averageGasUsd: 0.005,
    averageGasNative: 0.0000025,
    recommendedGasFloatUsd: 20.0,
    recommendedSweepThresholdUsd: 20.0,
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum L1 Mainnet",
    type: "Layer 1 Mainnet",
    nativeToken: "ETH",
    tokenPriceUsd: 2200,
    averageGasUsd: 2.80,
    averageGasNative: 0.0012,
    recommendedGasFloatUsd: 80.0,
    recommendedSweepThresholdUsd: 150.0,
  },
};

export interface PerimeterAuditReport {
  timestamp: string;
  activeSocketsCount: number;
  openPorts: number[];
  corsEnforced: boolean;
  rateLimitingActive: boolean;
  envCompartmentalization: {
    privateKeyInClientBundle: boolean;
    rpcKeysIsolatedInServer: boolean;
    seedPhraseExposed: boolean;
    status: "SECURE" | "WARNING" | "CRITICAL";
  };
}

export interface EngineGuardrails {
  maxSlippagePercent: number; // e.g. 0.3% - 0.5%
  maxGasFeePercentOfProfit: number; // e.g. 10% on L2
  gasPriceCeilingGwei: number; // e.g. 0.1 Gwei on L2, 60 on L1
  circuitBreakerActive: boolean;
  lastCircuitBreakerReason?: string;
  consecutiveSlippageBreaches: number;
  maxAllowedSlippageBreaches: number;
}

export interface ColdWalletSweepConfig {
  network: SupportedNetwork;
  hotWalletAddress: string;
  coldWalletAddress: string;
  profitSweepThresholdNative: number; // in native units (e.g. 0.009 ETH on L2 or 50 POL)
  profitSweepThresholdUsd: number; // e.g. $20
  operationalGasReserveNative: number; // e.g. 0.008 ETH (~$18) on Base
  operationalGasReserveUsd: number;
  autoSweepEnabled: boolean;
  multiSigType: "Ledger/Hardware" | "Gnosis Safe 2-of-3" | "Standard Cold EOA";
}

export interface SweepTransactionReceipt {
  id: string;
  timestamp: string;
  txHash: string;
  network: SupportedNetwork;
  networkName: string;
  nativeToken: string;
  fromHotWallet: string;
  toColdWallet: string;
  amountNative: number;
  amountUsd: number;
  gasPaidNative: number;
  gasPaidUsd: number;
  remainingHotReserveNative: number;
  triggerReason: "AUTOMATED_THRESHOLD_CROSSED" | "MANUAL_EMERGENCY_SWEEP" | "CIRCUIT_BREAKER_DRAIN";
  status: "CONFIRMED" | "BROADCASTED";
}

class BagHomeEngine {
  private currentNetwork: SupportedNetwork = "base"; // Default to Base (ultra low-cost L2)
  private hotWalletAddress = "0xHotTrader8891d4e7612fBa5C3970b4f8a1209B1";
  private coldWalletAddress = "0xD6d68800CD199D990C7ACCff409bE60c6508660a";

  // Balance tracked in native token units of current network
  private hotWalletBalanceNative = 0.022; // ~0.022 ETH on Base ($48.40)
  private coldWalletBalanceNative = 2.850; // ~2.85 ETH in cold storage ($6,270)

  private guardrails: EngineGuardrails = {
    maxSlippagePercent: 0.3, // Strict 0.3% on L2
    maxGasFeePercentOfProfit: 10.0, // Gas is negligible on L2
    gasPriceCeilingGwei: 0.25, // 0.25 Gwei on Base L2
    circuitBreakerActive: false,
    consecutiveSlippageBreaches: 0,
    maxAllowedSlippageBreaches: 3,
  };

  private sweepConfig: ColdWalletSweepConfig = {
    network: "base",
    hotWalletAddress: "0xHotTrader8891d4e7612fBa5C3970b4f8a1209B1",
    coldWalletAddress: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
    profitSweepThresholdNative: 0.0091, // ~$20.00
    profitSweepThresholdUsd: 20.0,
    operationalGasReserveNative: 0.0082, // ~$18.00 float
    operationalGasReserveUsd: 18.0,
    autoSweepEnabled: true,
    multiSigType: "Ledger/Hardware",
  };

  private sweepHistory: SweepTransactionReceipt[] = [
    {
      id: "swp-" + crypto.randomBytes(4).toString("hex"),
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      network: "base",
      networkName: "Base (Coinbase L2)",
      nativeToken: "ETH",
      fromHotWallet: "0xHotTrader8891d4e7612fBa5C3970b4f8a1209B1",
      toColdWallet: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
      amountNative: 0.0098,
      amountUsd: 21.56,
      gasPaidNative: 0.0000012,
      gasPaidUsd: 0.0026,
      remainingHotReserveNative: 0.0082,
      triggerReason: "AUTOMATED_THRESHOLD_CROSSED",
      status: "CONFIRMED",
    },
  ];

  public getPerimeterAudit(): PerimeterAuditReport {
    return {
      timestamp: new Date().toISOString(),
      activeSocketsCount: 7,
      openPorts: [3000, 8080, 8332, 5432, 6379, 6000, 7000],
      corsEnforced: true,
      rateLimitingActive: true,
      envCompartmentalization: {
        privateKeyInClientBundle: false,
        rpcKeysIsolatedInServer: true,
        seedPhraseExposed: false,
        status: "SECURE",
      },
    };
  }

  public getStatus() {
    const profile = NETWORK_PROFILES[this.currentNetwork];
    const hotUsd = Number((this.hotWalletBalanceNative * profile.tokenPriceUsd).toFixed(2));
    const coldUsd = Number((this.coldWalletBalanceNative * profile.tokenPriceUsd).toFixed(2));
    const excessBufferNative = Math.max(
      0,
      Number((this.hotWalletBalanceNative - this.sweepConfig.operationalGasReserveNative).toFixed(6))
    );
    const excessBufferUsd = Number((excessBufferNative * profile.tokenPriceUsd).toFixed(2));

    return {
      success: true,
      network: this.currentNetwork,
      networkProfile: profile,
      allNetworks: NETWORK_PROFILES,
      perimeter: this.getPerimeterAudit(),
      guardrails: this.guardrails,
      sweepConfig: this.sweepConfig,
      balances: {
        nativeToken: profile.nativeToken,
        tokenPriceUsd: profile.tokenPriceUsd,
        hotWalletAddress: this.sweepConfig.hotWalletAddress,
        hotWalletBalanceNative: Number(this.hotWalletBalanceNative.toFixed(6)),
        hotWalletBalanceUsd: hotUsd,
        coldWalletAddress: this.sweepConfig.coldWalletAddress,
        coldWalletBalanceNative: Number(this.coldWalletBalanceNative.toFixed(6)),
        coldWalletBalanceUsd: coldUsd,
        operationalGasReserveNative: this.sweepConfig.operationalGasReserveNative,
        operationalGasReserveUsd: this.sweepConfig.operationalGasReserveUsd,
        excessSweepingBufferNative: excessBufferNative,
        excessSweepingBufferUsd: excessBufferUsd,
      },
      history: this.sweepHistory,
    };
  }

  public setNetwork(network: SupportedNetwork) {
    if (!NETWORK_PROFILES[network]) return this.getStatus();
    this.currentNetwork = network;
    const profile = NETWORK_PROFILES[network];

    // Reset balances proportional to network
    if (network === "polygon") {
      this.hotWalletBalanceNative = 65.0; // 65 POL (~$26)
      this.coldWalletBalanceNative = 4250.0; // 4,250 POL (~$1,700)
      this.sweepConfig.operationalGasReserveNative = 50.0; // ~$20
      this.sweepConfig.operationalGasReserveUsd = 20.0;
      this.sweepConfig.profitSweepThresholdNative = 50.0; // ~$20
      this.sweepConfig.profitSweepThresholdUsd = 20.0;
      this.guardrails.gasPriceCeilingGwei = 80;
    } else {
      this.hotWalletBalanceNative = Number((profile.recommendedGasFloatUsd / profile.tokenPriceUsd + 0.005).toFixed(6));
      this.coldWalletBalanceNative = 2.85;
      this.sweepConfig.operationalGasReserveNative = Number((profile.recommendedGasFloatUsd / profile.tokenPriceUsd).toFixed(6));
      this.sweepConfig.operationalGasReserveUsd = profile.recommendedGasFloatUsd;
      this.sweepConfig.profitSweepThresholdNative = Number((profile.recommendedSweepThresholdUsd / profile.tokenPriceUsd).toFixed(6));
      this.sweepConfig.profitSweepThresholdUsd = profile.recommendedSweepThresholdUsd;
      this.guardrails.gasPriceCeilingGwei = network === "ethereum" ? 65 : 0.5;
    }

    this.sweepConfig.network = network;
    return this.getStatus();
  }

  public updateConfig(updates: Partial<ColdWalletSweepConfig> & Partial<EngineGuardrails> & { network?: SupportedNetwork }) {
    if (updates.network && updates.network !== this.currentNetwork) {
      this.setNetwork(updates.network);
    }
    if (updates.coldWalletAddress && ethers.isAddress(updates.coldWalletAddress)) {
      this.sweepConfig.coldWalletAddress = updates.coldWalletAddress;
    }
    if (updates.profitSweepThresholdNative !== undefined && updates.profitSweepThresholdNative > 0) {
      this.sweepConfig.profitSweepThresholdNative = Number(updates.profitSweepThresholdNative);
      const profile = NETWORK_PROFILES[this.currentNetwork];
      this.sweepConfig.profitSweepThresholdUsd = Number((this.sweepConfig.profitSweepThresholdNative * profile.tokenPriceUsd).toFixed(2));
    }
    if (updates.operationalGasReserveNative !== undefined && updates.operationalGasReserveNative > 0) {
      this.sweepConfig.operationalGasReserveNative = Number(updates.operationalGasReserveNative);
      const profile = NETWORK_PROFILES[this.currentNetwork];
      this.sweepConfig.operationalGasReserveUsd = Number((this.sweepConfig.operationalGasReserveNative * profile.tokenPriceUsd).toFixed(2));
    }
    if (updates.autoSweepEnabled !== undefined) {
      this.sweepConfig.autoSweepEnabled = Boolean(updates.autoSweepEnabled);
    }
    if (updates.multiSigType) {
      this.sweepConfig.multiSigType = updates.multiSigType;
    }
    if (updates.maxSlippagePercent !== undefined) {
      this.guardrails.maxSlippagePercent = Number(updates.maxSlippagePercent);
    }
    if (updates.maxGasFeePercentOfProfit !== undefined) {
      this.guardrails.maxGasFeePercentOfProfit = Number(updates.maxGasFeePercentOfProfit);
    }
    if (updates.gasPriceCeilingGwei !== undefined) {
      this.guardrails.gasPriceCeilingGwei = Number(updates.gasPriceCeilingGwei);
    }
    if (updates.circuitBreakerActive !== undefined) {
      this.guardrails.circuitBreakerActive = Boolean(updates.circuitBreakerActive);
      if (!this.guardrails.circuitBreakerActive) {
        this.guardrails.lastCircuitBreakerReason = undefined;
      }
    }

    return this.getStatus();
  }

  public executeManualSweep(
    reason: "MANUAL_EMERGENCY_SWEEP" | "CIRCUIT_BREAKER_DRAIN" | "AUTOMATED_THRESHOLD_CROSSED" = "MANUAL_EMERGENCY_SWEEP"
  ) {
    const profile = NETWORK_PROFILES[this.currentNetwork];
    const sweepableNative = this.hotWalletBalanceNative - this.sweepConfig.operationalGasReserveNative;

    const minSweepable = this.currentNetwork === "polygon" ? 1.0 : 0.0002;
    if (sweepableNative <= minSweepable) {
      throw new Error(
        `Insufficient hot balance to sweep. Current balance (${this.hotWalletBalanceNative.toFixed(
          4
        )} ${profile.nativeToken}) is at or below operational reserve (${this.sweepConfig.operationalGasReserveNative} ${profile.nativeToken}).`
      );
    }

    const gasPaidNative = profile.averageGasNative;
    const netSweep = sweepableNative - gasPaidNative;

    if (netSweep <= 0) {
      throw new Error("Gas cost exceeds sweep amount.");
    }

    this.hotWalletBalanceNative = this.sweepConfig.operationalGasReserveNative;
    this.coldWalletBalanceNative += netSweep;

    const receipt: SweepTransactionReceipt = {
      id: "swp-" + crypto.randomBytes(4).toString("hex"),
      timestamp: new Date().toLocaleTimeString(),
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      network: this.currentNetwork,
      networkName: profile.name,
      nativeToken: profile.nativeToken,
      fromHotWallet: this.sweepConfig.hotWalletAddress,
      toColdWallet: this.sweepConfig.coldWalletAddress,
      amountNative: Number(netSweep.toFixed(6)),
      amountUsd: Number((netSweep * profile.tokenPriceUsd).toFixed(2)),
      gasPaidNative,
      gasPaidUsd: profile.averageGasUsd,
      remainingHotReserveNative: this.sweepConfig.operationalGasReserveNative,
      triggerReason: reason,
      status: "CONFIRMED",
    };

    this.sweepHistory.unshift(receipt);
    return receipt;
  }

  public simulateArbitrageHarvest(profitUsd: number = 22.0) {
    if (this.guardrails.circuitBreakerActive) {
      throw new Error(`Cannot execute trade: Fail-safe circuit breaker is ACTIVE (${this.guardrails.lastCircuitBreakerReason || "Emergency Halt"}).`);
    }

    const profile = NETWORK_PROFILES[this.currentNetwork];
    const profitNative = Number((profitUsd / profile.tokenPriceUsd).toFixed(6));

    // Add net trade profit to hot trading balance
    this.hotWalletBalanceNative += profitNative;

    let triggeredSweep: SweepTransactionReceipt | null = null;

    // Check if accumulated excess profit crosses auto-sweep threshold
    const excessProfit = this.hotWalletBalanceNative - this.sweepConfig.operationalGasReserveNative;
    if (this.sweepConfig.autoSweepEnabled && excessProfit >= this.sweepConfig.profitSweepThresholdNative) {
      triggeredSweep = this.executeManualSweep("AUTOMATED_THRESHOLD_CROSSED");
    }

    return {
      success: true,
      network: this.currentNetwork,
      harvestedProfitNative: profitNative,
      harvestedProfitUsd: profitUsd,
      currentHotBalanceNative: this.hotWalletBalanceNative,
      triggeredSweep,
      status: this.getStatus(),
    };
  }

  public triggerSlippageBreachSimulation() {
    this.guardrails.consecutiveSlippageBreaches += 1;
    if (this.guardrails.consecutiveSlippageBreaches >= this.guardrails.maxAllowedSlippageBreaches) {
      this.guardrails.circuitBreakerActive = true;
      this.guardrails.lastCircuitBreakerReason = `Circuit Breaker Tripped: ${this.guardrails.consecutiveSlippageBreaches} consecutive slippage breaches detected exceeding ${this.guardrails.maxSlippagePercent}% tolerance.`;
    }
    return this.getStatus();
  }
}

export const bagHomeEngine = new BagHomeEngine();
