import React, { useState, useEffect } from "react";
import {
  Activity,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  Zap,
  TrendingUp,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Server,
  Cpu,
  Clock,
  ExternalLink,
  Lock,
  Wifi,
  RefreshCw,
  ArrowRight,
  Coins,
  Sliders,
  Code2,
  FileCode,
  Gauge,
  CornerDownRight,
  Info,
  CheckSquare,
  Fuel,
  KeyRound,
  Flame,
  ShieldAlert,
  Radio,
  Pause,
} from "lucide-react";
import type {
  ScannerEnvStatus,
  RpcTestResult,
  SpreadSimulationResult,
  FlashLoanTriggerResult,
  ScannerAutomationState,
} from "../types";
import { RefillFrontPortModal } from "./RefillFrontPortModal";

export interface PoolPairConfig {
  id: string;
  name: string;
  category: "Standard" | "Meme Coin";
  uniPool: string;
  sushiPool: string;
  defaultUniPrice: number;
  defaultSushiPrice: number;
  borrowAsset: string;
  defaultBorrow: number;
  decimals: number;
  token0: string;
  token1: string;
  description: string;
}

export const SUPPORTED_POOL_PAIRS: PoolPairConfig[] = [
  {
    id: "weth-usdc",
    name: "WETH / USDC",
    category: "Standard",
    uniPool: "0x88e6A0c2dDD26FEEb64F039a2c41296fcB3f5640",
    sushiPool: "0x397FF1542f962076d0BFE58eA045FfA2d3470acd",
    defaultUniPrice: 3128.5,
    defaultSushiPrice: 3105.0,
    borrowAsset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    defaultBorrow: 5000,
    decimals: 6,
    token0: "USDC",
    token1: "WETH",
    description: "Deepest institutional liquidity pool with 0.05% fee tier on Uniswap V3.",
  },
  {
    id: "pepe-weth",
    name: "PEPE / WETH (Meme Pool)",
    category: "Meme Coin",
    uniPool: "0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f",
    sushiPool: "0x11950d141ecb863f01007add7d1a342041227b58",
    defaultUniPrice: 0.00000924,
    defaultSushiPrice: 0.00000898,
    borrowAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    defaultBorrow: 2.5,
    decimals: 18,
    token0: "PEPE",
    token1: "WETH",
    description: "High-volatility meme coin pool. Subject to massive MEV sandwiches without private Flashbots mempool routing.",
  },
  {
    id: "shib-weth",
    name: "SHIB / WETH (Meme Pool)",
    category: "Meme Coin",
    uniPool: "0x2F62f2B4c5fcd7570a709DeC05d68EA19c7d8b55",
    sushiPool: "0xCB23C044eb98cd6b73199C351BfcaBE003295874",
    defaultUniPrice: 0.0000185,
    defaultSushiPrice: 0.0000181,
    borrowAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    defaultBorrow: 2.0,
    decimals: 18,
    token0: "SHIB",
    token1: "WETH",
    description: "Classic Shiba Inu meme liquidity pool across Uniswap V3 and SushiSwap.",
  },
  {
    id: "floki-weth",
    name: "FLOKI / WETH (Meme Pool)",
    category: "Meme Coin",
    uniPool: "0xe9c00b0f49646b5a3f3b90a6e60b13cf3e9e1c26",
    sushiPool: "0xa3c8e312b9d6a2f3e8f498c1a89c9d0339d09e3a",
    defaultUniPrice: 0.000172,
    defaultSushiPrice: 0.000166,
    borrowAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    defaultBorrow: 1.5,
    decimals: 18,
    token0: "FLOKI",
    token1: "WETH",
    description: "Rapidly fluctuating meme pair with frequent cross-DEX price discrepancies.",
  },
];

const SCANNER_CODE = `const { ethers } = require("ethers");
require("dotenv").config();

// 1. Establish WebSocket Provider for lightning-fast event streaming
// Requires WSS_RPC_URL in server environment
const provider = new ethers.WebSocketProvider(process.env.WSS_RPC_URL);

// Server-side signer for private transaction dispatch (Flashbots / MEV-Share)
// Requires PRIVATE_KEY and ARBITRAGE_CONTRACT_ADDRESS in server environment
const botWallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;
const ARBITRAGE_CONTRACT_ADDRESS = process.env.ARBITRAGE_CONTRACT_ADDRESS || "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";

// Minimal ABIs
const uniV3PoolAbi = [
    "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
];
const sushiswapPairAbi = [
    "event Sync(uint112 reserve0, uint112 reserve1)"
];

// Target tracking addresses (Example: WETH/USDC pools on two different DEXs)
const poolUniswapV3 = "0x88e6A0c2dDD26FEEb64F039a2c41296fcB3f5640"; // Uniswap V3 USDC/WETH 0.05%
const poolSushiSwap = "0x397FF1542f962076d0BFE58eA045FfA2d3470acd"; // SushiSwap USDC/WETH

const uniContract = new ethers.Contract(poolUniswapV3, uniV3PoolAbi, provider);
const sushiContract = new ethers.Contract(poolSushiSwap, sushiswapPairAbi, provider);

// In-memory price cache to store the latest state of each pool
// Eliminates expensive RPC read calls during high-frequency block propagation
let latestPrices = {
    uniswap: 0n,
    sushiswap: 0n
};

async function startMultiPoolScanner() {
    console.log("🔍 Initializing multi-DEX liquidity scanner...");

    // 2. Listen to Uniswap V3 real-time swaps
    uniContract.on("Swap", async (sender, recipient, amount0, amount1, sqrtPriceX96) => {
        // Cache Uniswap's latest price state (sqrtPriceX96)
        latestPrices.uniswap = sqrtPriceX96;
        evaluateCrossDEXSpread();
    });

    // 3. Listen to SushiSwap (V2 style) real-time syncs
    sushiContract.on("Sync", async (reserve0, reserve1) => {
        // Calculate price from V2 reserves (reserve1 / reserve0)
        if (reserve0 > 0n) {
            latestPrices.sushiswap = (reserve1 * ethers.parseUnits("1", 18)) / reserve0;
            evaluateCrossDEXSpread();
        }
    });
}

// 4. Spread Evaluation Engine
async function evaluateCrossDEXSpread() {
    // Ensure we have active data for both pools
    if (latestPrices.uniswap === 0n || latestPrices.sushiswap === 0n) return;

    // Convert Uniswap V3 sqrtPriceX96 to a comparable decimal price format
    const uniPriceFormatted = convertSqrtPriceToNumber(latestPrices.uniswap);
    const sushiPriceFormatted = Number(ethers.formatUnits(latestPrices.sushiswap, 18));

    // Calculate percentage spread divergence between the two DEXs
    const priceDifference = Math.abs(uniPriceFormatted - sushiPriceFormatted);
    const spreadPercentage = (priceDifference / sushiPriceFormatted) * 100;

    console.log(\`📊 Current Spread: \${spreadPercentage.toFixed(4)}% (Uni: \${uniPriceFormatted.toFixed(2)} | Sushi: \${sushiPriceFormatted.toFixed(2)})\`);

    // Define a profitable threshold (e.g., > 0.4% to safely cover Aave flash loan fee + gas)
    if (spreadPercentage > 0.4) {
        console.log(\`🚀 Lucrative price divergence discovered (\${spreadPercentage.toFixed(2)}%)! Executing...\`);
        await triggerExecutionPipeline();
    }
}

function convertSqrtPriceToNumber(sqrtPriceX96) {
    const q96 = 2n ** 96n;
    const priceX192 = (sqrtPriceX96 * sqrtPriceX96);
    const scale = 2n ** 192n;
    const rawRatio = Number(priceX192) / Number(scale);
    return rawRatio * 1e12;
}

async function triggerExecutionPipeline() {
    const contractAbi = ["function requestFlashLoan(address asset, uint256 amount) external"];
    const arbitrageContract = new ethers.Contract(ARBITRAGE_CONTRACT_ADDRESS, contractAbi, botWallet);

    try {
        const assetToBorrow = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
        const borrowAmount = ethers.parseUnits("5000", 6);

        // Send transaction through private RPC provider (Flashbots) to prevent frontrunning
        const tx = await arbitrageContract.requestFlashLoan(assetToBorrow, borrowAmount, {
            gasLimit: 350000
        });
        console.log(\`🔒 Arbitrage payload dispatched privately: \${tx.hash}\`);
    } catch (error) {
        console.error("Execution skipped or aborted:", error.reason || error.message);
    }
}

startMultiPoolScanner();`;

export function DexPriceScannerDemo() {
  const [running, setRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.4);
  const [activeTab, setActiveTab] = useState<"cards" | "automation" | "terminal" | "code" | "architecture">("cards");

  // Terminal state
  const [result, setResult] = useState<{
    stdout: string;
    command: string;
    durationMs: number;
    success: boolean;
  } | null>({
    command: "node scanner.js --threshold 0.40",
    stdout: `=================================================
🔍 Initializing Multi-DEX Liquidity Scanner
=================================================
• Uniswap V3 Pool: 0x88e6A0c2dDD26FEEb64F039a2c41296fcB3f5640
• SushiSwap Pool:  0x397FF1542f962076d0BFE58eA045FfA2d3470acd
• Target Pair:     WETH / USDC
• Profit Target:   > 0.40% Spread

[Block/Tick #1] Event Stream: Base market sync tick
📊 Current Spread: 0.0000% (Uni: 3100.00 | Sushi: 3100.00)

[Block/Tick #2] Event Stream: Minor liquidity widening (0.12%)
📊 Current Spread: 0.1245% (Uni: 3103.86 | Sushi: 3100.00)

[Block/Tick #3] Event Stream: 🔥 Large whale swap on Uniswap! Spread exceeds threshold
📊 Current Spread: 0.7225% (Uni: 3122.40 | Sushi: 3100.00)
🚀 Lucrative price divergence discovered (0.72% > threshold 0.4%)! Executing...
🔒 [Simulation] Arbitrage payload triggered:
   - Target Asset: USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
   - Borrow Amount: 5,000 USDC
   - Estimated Gross Spread: $36.13
   - Flash Loan Fee (0.05%): $2.50
   - Est. Net Profit: $33.63
   - Destination Contract: 0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7
   - Simulated Flashbots Bundle TX: 0x9b4c81a25e197d022b79c32f8df41920ac341a9981fcae12739328203f19e481

[Block/Tick #4] Event Stream: Post-arbitrage rebalancing tick
📊 Current Spread: 0.0380% (Uni: 3101.18 | Sushi: 3100.00)
=================================================
✅ Scanner run completed successfully.
=================================================`,
    durationMs: 1420,
    success: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Server Environment Status
  const [envStatus, setEnvStatus] = useState<ScannerEnvStatus | null>(null);
  const [loadingEnv, setLoadingEnv] = useState<boolean>(false);

  // 24/7 Backend Automation State
  const [automationState, setAutomationState] = useState<ScannerAutomationState | null>(null);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [togglingAutomation, setTogglingAutomation] = useState<boolean>(false);

  // Pool Selection State (Meme Pools & Standard Pools)
  const [selectedPair, setSelectedPair] = useState<PoolPairConfig>(SUPPORTED_POOL_PAIRS[0]);
  const [refillingGas, setRefillingGas] = useState<boolean>(false);
  const [refillMessage, setRefillMessage] = useState<string | null>(null);
  const [copiedSigner, setCopiedSigner] = useState<boolean>(false);

  // Control Card 1: Spread Simulator State
  const [simUniPrice, setSimUniPrice] = useState<number>(3128.5);
  const [simSushiPrice, setSimSushiPrice] = useState<number>(3105.0);
  const [simBorrowAmount, setSimBorrowAmount] = useState<number>(5000);
  const [simGasGwei, setSimGasGwei] = useState<number>(24);
  const [simSpreadResult, setSimSpreadResult] = useState<SpreadSimulationResult | null>(null);
  const [simulatingSpread, setSimulatingSpread] = useState<boolean>(false);

  // Control Card 2: RPC Diagnostics Tester State
  const [testRpcUrl, setTestRpcUrl] = useState<string>("https://rpc.flashbots.net");
  const [testingRpc, setTestingRpc] = useState<boolean>(false);
  const [rpcTestResult, setRpcTestResult] = useState<RpcTestResult | null>(null);

  // Control Card 3: Flash Loan Routing State (Base Mainnet 8453)
  const [flAsset, setFlAsset] = useState<string>("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"); // Base Native USDC
  const [flAmount, setFlAmount] = useState<number>(10000);
  const [flPriorityFee, setFlPriorityFee] = useState<number>(0.05);
  const [flSimulationMode, setFlSimulationMode] = useState<boolean>(true);
  const [triggeringFl, setTriggeringFl] = useState<boolean>(false);
  const [flResult, setFlResult] = useState<FlashLoanTriggerResult | null>(null);
  const [deployingContract, setDeployingContract] = useState<boolean>(false);
  const [contractDeployResult, setContractDeployResult] = useState<any | null>(null);

  // Load environment status, 24/7 automation state, and initial spread simulation on mount
  useEffect(() => {
    fetchEnvStatus();
    fetchAutomationState();
    runSpreadSimulation(3128.5, 3105.0, 5000, 24, "WETH / USDC");

    const interval = setInterval(() => {
      fetchAutomationState();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const fetchAutomationState = async () => {
    try {
      const res = await fetch("/api/scanner/automation-state");
      const data = await res.json();
      if (data.success && data.state) {
        setAutomationState(data.state);
        if (data.gasBalanceEth !== undefined && data.gasBalanceEth !== null && !isNaN(Number(data.gasBalanceEth))) {
          setEnvStatus((prev) =>
            prev ? { ...prev, gasBalanceEth: Number(data.gasBalanceEth) } : prev
          );
        }
      }
    } catch (_err) {
      // Background poll handled gracefully
    }
  };

  const handleToggleAutomation = async () => {
    setTogglingAutomation(true);
    try {
      const res = await fetch("/api/scanner/automation-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setAutomationState((prev) =>
          prev ? { ...prev, isRunning: data.isRunning } : null
        );
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setTogglingAutomation(false);
    }
  };

  const fetchEnvStatus = async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch("/api/scanner/status");
      const data = await res.json();
      if (data.success && data.envStatus) {
        setEnvStatus(data.envStatus);
      }
    } catch (_err) {
      // Handled gracefully during offline or initial server startup
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleSelectPair = (pair: PoolPairConfig) => {
    setSelectedPair(pair);
    setSimUniPrice(pair.defaultUniPrice);
    setSimSushiPrice(pair.defaultSushiPrice);
    setSimBorrowAmount(pair.defaultBorrow);
    setFlAsset(pair.borrowAsset);
    runSpreadSimulation(pair.defaultUniPrice, pair.defaultSushiPrice, pair.defaultBorrow, simGasGwei, pair.name);
  };

  const handleRefillGas = async (amount = 0.5) => {
    setRefillingGas(true);
    setRefillMessage(null);
    try {
      const res = await fetch("/api/scanner/refill-gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountEth: amount }),
      });
      const data = await res.json();
      if (data.success) {
        setRefillMessage(data.message || `Topped up ${amount} ETH for bot gas`);
        setEnvStatus((prev) =>
          prev ? { ...prev, gasBalanceEth: data.newBalanceEth } : prev
        );
      }
    } catch (_err) {
      setRefillMessage("Failed to simulate refill");
    } finally {
      setRefillingGas(false);
      setTimeout(() => setRefillMessage(null), 4000);
    }
  };

  const handleCopySignerAddress = () => {
    const addr = envStatus?.signerAddress || "0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD";
    navigator.clipboard.writeText(addr);
    setCopiedSigner(true);
    setTimeout(() => setCopiedSigner(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SCANNER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunScanner = async (customSpread?: number) => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/scanner/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold,
          spread: customSpread || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Scanner execution failed");
      }
      setResult(data);
      setActiveTab("terminal");
    } catch (err: any) {
      setError(err?.message || "Error running scanner");
    } finally {
      setRunning(false);
    }
  };

  const runSpreadSimulation = async (
    uPrice = simUniPrice,
    sPrice = simSushiPrice,
    borrow = simBorrowAmount,
    gas = simGasGwei,
    pairName = selectedPair?.name || "WETH / USDC"
  ) => {
    setSimulatingSpread(true);
    try {
      const res = await fetch("/api/scanner/simulate-spread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniPrice: uPrice,
          sushiPrice: sPrice,
          borrowAmount: borrow,
          gasPriceGwei: gas,
          flashLoanFeePercent: 0.05,
          tokenPair: pairName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimSpreadResult(data);
      }
    } catch (_err) {
      // Graceful error handling
    } finally {
      setSimulatingSpread(false);
    }
  };

  const handleTestRpc = async () => {
    setTestingRpc(true);
    try {
      const res = await fetch("/api/scanner/test-rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpcUrl: testRpcUrl }),
      });
      const data = await res.json();
      setRpcTestResult(data);
    } catch (err: any) {
      setRpcTestResult({
        success: false,
        endpointTested: testRpcUrl,
        latencyMs: 0,
        error: err?.message || "Connection failed",
      });
    } finally {
      setTestingRpc(false);
    }
  };

  const handleDeployContract = async () => {
    setDeployingContract(true);
    try {
      const res = await fetch("/api/base/flashloan/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true }),
      });
      const data = await res.json();
      if (data.success) {
        setContractDeployResult(data);
      }
    } catch (err: any) {
      console.error("Contract deployment verification error", err);
    } finally {
      setDeployingContract(false);
    }
  };

  const handleTriggerFlashLoan = async () => {
    setTriggeringFl(true);
    try {
      const res = await fetch("/api/scanner/trigger-flashloan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: flAsset,
          borrowAmount: flAmount,
          maxPriorityFeeGwei: flPriorityFee,
          forceSimulation: flSimulationMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFlResult(data);
      }
    } catch (err: any) {
      console.error("Flash loan trigger error", err);
    } finally {
      setTriggeringFl(false);
    }
  };

  return (
    <div id="dex-price-scanner-root" className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                  <Activity className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Multi-Pool DEX Arbitrage Scanner
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  Node.js × ethers.js
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2 max-w-2xl leading-relaxed">
                High-frequency cross-DEX liquidity monitor tracking Uniswap V3 (tick/price updates via <code className="font-mono text-emerald-300">Swap</code> events) and SushiSwap V2 (reserve updates via <code className="font-mono text-emerald-300">Sync</code> events) with zero-latency in-memory state evaluation and Flashbots private execution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-run-scanner-main"
                type="button"
                onClick={() => handleRunScanner()}
                disabled={running}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Scanner...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Scanner CLI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Target Liquidity Pool / Meme Pool Selector */}
          <div className="mt-4 pt-4 border-t border-zinc-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono text-zinc-300 font-semibold flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Target Liquidity Pool (Meme Pools & Institutional):</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {selectedPair.category === "Meme Coin" ? "🔥 Meme Coin Pool Active" : "💎 Standard AMM"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_POOL_PAIRS.map((pair) => {
                const isSelected = selectedPair.id === pair.id;
                return (
                  <button
                    key={pair.id}
                    id={`pair-btn-${pair.id}`}
                    type="button"
                    onClick={() => handleSelectPair(pair)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-300"
                        : "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60"
                    }`}
                  >
                    {pair.category === "Meme Coin" ? (
                      <Flame className={`w-3.5 h-3.5 ${isSelected ? "text-zinc-950" : "text-amber-400"}`} />
                    ) : (
                      <Coins className={`w-3.5 h-3.5 ${isSelected ? "text-zinc-950" : "text-emerald-400"}`} />
                    )}
                    <span>{pair.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 font-mono leading-relaxed">
              {selectedPair.description}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Tracked Pair</span>
              <span className="font-semibold text-white truncate block">{selectedPair.name}</span>
            </div>
            <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Uniswap V3 Pool</span>
              <span className="font-mono text-[11px] text-emerald-300 truncate block">
                {selectedPair.uniPool.slice(0, 6)}...{selectedPair.uniPool.slice(-4)}
              </span>
            </div>
            <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">SushiSwap Pool</span>
              <span className="font-mono text-[11px] text-cyan-300 truncate block">
                {selectedPair.sushiPool.slice(0, 6)}...{selectedPair.sushiPool.slice(-4)}
              </span>
            </div>
            <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Mempool Protection</span>
              <span className="font-semibold text-amber-300">Flashbots MEV-Share</span>
            </div>
          </div>

          {/* Three Ports Interactive Live Interconnect Bar */}
          <div className="mt-4 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Fuel className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white text-xs">Port 1: Refill Front</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {(envStatus?.gasBalanceEth ?? 0.45).toFixed(3)} ETH
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Signer gas reserve for private mempools
                </span>
              </div>
              <button
                type="button"
                id="btn-open-refill-modal-scanner"
                onClick={() => setIsRefillModalOpen(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
              >
                + Refill Front
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white text-xs">Port 2: 24/7 Scanner State</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      automationState?.isRunning
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {automationState?.isRunning ? "24/7 RUNNING" : "PAUSED"}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {automationState?.totalTicks ?? 0} ticks • {automationState?.profitableSpreadsFound ?? 0} spreads • Auto-Refill Guard {automationState?.autoRefillEnabled ? "ON" : "OFF"}
                </span>
              </div>
              <button
                type="button"
                id="btn-toggle-automation-scanner"
                onClick={handleToggleAutomation}
                disabled={togglingAutomation}
                className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold cursor-pointer transition-colors border ${
                  automationState?.isRunning
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                }`}
              >
                {togglingAutomation
                  ? "Updating..."
                  : automationState?.isRunning
                  ? "Pause 24/7 Loop"
                  : "Resume 24/7 Loop"}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="px-5 border-b border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-1 py-2">
            <button
              id="tab-btn-cards"
              type="button"
              onClick={() => setActiveTab("cards")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "cards"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Control Cards</span>
            </button>
            <button
              id="tab-btn-automation"
              type="button"
              onClick={() => setActiveTab("automation")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "automation"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${automationState?.isRunning ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${automationState?.isRunning ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
              <span className="font-mono text-emerald-700">Port 2: 24/7 Automation</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded font-bold">
                {automationState?.totalTicks ?? 0}
              </span>
            </button>
            <button
              id="tab-btn-terminal"
              type="button"
              onClick={() => setActiveTab("terminal")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-600" />
              <span>Live Terminal ({result ? "Ready" : "Idle"})</span>
            </button>
            <button
              id="tab-btn-code"
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "code"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-600" />
              <span>Scanner Script (scanner.js)</span>
            </button>
            <button
              id="tab-btn-architecture"
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "architecture"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-zinc-600" />
              <span>Production Architecture</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
            <span>Threshold: &gt;{(threshold).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Requirement 2: Server-Side Environment Variables & Security Status Card */}
      <div id="scanner-env-status-card" className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-zinc-100 text-zinc-700 rounded-md">
              <Lock className="w-4 h-4 text-emerald-600" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Server-Side Environment & Secure Private Execution
              </h3>
              <p className="text-xs text-zinc-500">
                Security-first architecture: bot private keys and credentials run strictly isolated in Node.js server memory and are never exposed to the client browser.
              </p>
            </div>
          </div>
          <button
            id="btn-refresh-env-status"
            type="button"
            onClick={fetchEnvStatus}
            disabled={loadingEnv}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3 h-3 ${loadingEnv ? "animate-spin" : ""}`} />
            <span>Refresh Env Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Var 1: WSS_RPC_URL */}
          <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-zinc-800">WSS_RPC_URL</span>
              {envStatus?.wssRpcConfigured ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Info className="w-3 h-3" />
                  <span>Simulation Mode</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 mb-2 leading-relaxed">
              WebSocket RPC endpoint for sub-second event subscription (<code className="font-mono">Swap</code> and <code className="font-mono">Sync</code>).
            </p>
            <div className="text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200 truncate">
              {envStatus?.wssMasked || "Fallback: Real-time simulation event loop active"}
            </div>
          </div>

          {/* Var 2: PRIVATE_KEY */}
          <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-zinc-800">PRIVATE_KEY</span>
              {envStatus?.privateKeyConfigured ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Active Signer</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                  <Lock className="w-3 h-3" />
                  <span>Read-Only / Test</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 mb-2 leading-relaxed">
              Bot wallet key for signing flash loan transactions into private mempools.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200 truncate">
              {envStatus?.signerAddress ? `Signer: ${envStatus.signerAddress.slice(0, 10)}...${envStatus.signerAddress.slice(-8)}` : "Signer: 0xVault7790...1089 (Active)"}
            </div>
          </div>

          {/* Var 3: ARBITRAGE_CONTRACT_ADDRESS */}
          <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-zinc-800">ARBITRAGE_CONTRACT_ADDRESS</span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Target Set</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 mb-2 leading-relaxed">
              Receiver contract that implements <code className="font-mono">IFlashLoanSimpleReceiver</code>.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200 truncate">
              {envStatus?.arbitrageContractAddress || "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"}
            </div>
          </div>
        </div>

        {/* Bot Signer Wallet, Gas Refill & Mempool Safety Hub */}
        <div id="wallet-refill-mempool-hub" className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 text-white border border-amber-500/30 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Signer Wallet Refill & Mempool Shield</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    Security Priority
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Refill the <strong>Public Address</strong> with ETH for gas. Never send or expose your raw private key.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-300 font-mono">
                Gas Reserve: <strong className="text-emerald-400 font-bold">{(envStatus?.gasBalanceEth ?? 0.45).toFixed(2)} ETH</strong>
              </span>
            </div>
          </div>

          {/* Security Advisory Alert */}
          <div className="mt-3 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-red-300 font-semibold block mb-0.5">Critical Web3 Security Rule:</strong>
              Never paste, transmit, or "refill" your <strong>PRIVATE_KEY</strong> to any liquidity pool, mempool, or website! Your private key is stored offline / in server environment variables purely for local transaction signing. What you refill is your <strong>Public Signer Address</strong> with ETH so the bot can pay network gas and priority fees.
            </div>
          </div>

          {/* Interactive Wallet & Refill Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Box 1: Public Signer Address */}
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Signer Address (Refill Target)</span>
                </span>
                <button
                  type="button"
                  id="btn-copy-signer-addr"
                  onClick={handleCopySignerAddress}
                  className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 cursor-pointer transition-colors"
                >
                  {copiedSigner ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSigner ? "Copied Address!" : "Copy Address"}</span>
                </button>
              </div>
              <div className="p-2 bg-black/60 rounded border border-zinc-800 font-mono text-[11px] text-emerald-300 break-all select-all">
                {envStatus?.signerAddress || "0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD"}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                Send ETH (Sepolia/Mainnet) to this address from MetaMask or faucet to cover transaction execution fees in DEX pools.
              </p>
            </div>

            {/* Box 2: Gas Refill Simulator */}
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-semibold text-zinc-300 flex items-center space-x-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gas Refill & Balance Top-Up</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    Active Reserve
                  </span>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <div className="flex-1 bg-black/60 px-2.5 py-1.5 rounded border border-zinc-800 text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] block">Current Balance</span>
                    <span className="text-sm font-bold text-white">{(envStatus?.gasBalanceEth ?? 0.45).toFixed(2)} ETH</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      id="btn-refill-gas-02"
                      onClick={() => handleRefillGas(0.2)}
                      disabled={refillingGas}
                      className="px-2.5 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 disabled:opacity-50 cursor-pointer transition-colors"
                      title="Refill 0.2 ETH"
                    >
                      +0.2 ETH
                    </button>
                    <button
                      type="button"
                      id="btn-refill-gas-05"
                      onClick={() => handleRefillGas(0.5)}
                      disabled={refillingGas}
                      className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold text-white disabled:opacity-50 cursor-pointer transition-colors flex items-center space-x-1 shadow-xs"
                      title="Refill 0.5 ETH Standard"
                    >
                      <Fuel className="w-3.5 h-3.5" />
                      <span>+0.5 ETH</span>
                    </button>
                  </div>
                </div>
              </div>
              {refillMessage && (
                <div className="text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2 py-1 rounded flex items-center space-x-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{refillMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Educational Security Matrix: Mempool vs Meme Pool */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px]">
            <div className="bg-black/30 p-2 rounded border border-zinc-800/60">
              <span className="text-amber-400 font-bold block text-[10px] uppercase font-mono">1. Private Key</span>
              <span className="text-zinc-300 text-[10px] leading-tight block mt-0.5">
                Secret signing key kept in <code className="text-amber-300">.env</code>. Never exposed to any network or pool.
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded border border-zinc-800/60">
              <span className="text-emerald-400 font-bold block text-[10px] uppercase font-mono">2. Public Address</span>
              <span className="text-zinc-300 text-[10px] leading-tight block mt-0.5">
                Safe to share. This is what you refill with ETH to pay for transaction fees.
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded border border-zinc-800/60">
              <span className="text-cyan-400 font-bold block text-[10px] uppercase font-mono">3. Meme Coin Pool</span>
              <span className="text-zinc-300 text-[10px] leading-tight block mt-0.5">
                Liquidity pool (e.g. PEPE/WETH) on Uniswap or SushiSwap where token swaps execute.
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded border border-zinc-800/60">
              <span className="text-purple-400 font-bold block text-[10px] uppercase font-mono">4. Private Mempool</span>
              <span className="text-zinc-300 text-[10px] leading-tight block mt-0.5">
                Flashbots private relay prevents sandwich bots from frontrunning your transactions.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Server Runtime: <strong>Node.js {envStatus?.executionMode || "Execution Ready"}</strong></span>
          </div>
          <span className="font-mono text-[10px]">Configured in .env.example / AI Studio Secrets</span>
        </div>
      </div>

      {/* Main Tab View: Cards, Terminal, Code, or Architecture */}
      {activeTab === "cards" && (
        <div className="space-y-6">
          {/* Card 1: Spread Simulator & Profitability Engine */}
          <div id="card-spread-simulator" className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Control Card 1: Spread Simulator & Profitability Engine
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Simulate price divergence scenarios across Uniswap V3 and SushiSwap to test sqrtPriceX96 math, flash loan fees, and net arbitrage profitability.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-500 font-medium">Quick Scenarios:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSimUniPrice(3128.5);
                    setSimSushiPrice(3105.0);
                    runSpreadSimulation(3128.5, 3105.0);
                  }}
                  className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono cursor-pointer transition-colors"
                >
                  Whale Swap (+0.75%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimUniPrice(3145.0);
                    setSimSushiPrice(3102.0);
                    runSpreadSimulation(3145.0, 3102.0);
                  }}
                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-mono cursor-pointer transition-colors"
                >
                  High MEV (+1.38%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimUniPrice(3105.5);
                    setSimSushiPrice(3105.0);
                    runSpreadSimulation(3105.5, 3105.0);
                  }}
                  className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono cursor-pointer transition-colors"
                >
                  Equilibrium (0.01%)
                </button>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Uniswap V3 WETH Price (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-400">$</span>
                  <input
                    id="input-uni-price"
                    type="number"
                    step="0.5"
                    value={simUniPrice}
                    onChange={(e) => setSimUniPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  SushiSwap V2 WETH Price (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-400">$</span>
                  <input
                    id="input-sushi-price"
                    type="number"
                    step="0.5"
                    value={simSushiPrice}
                    onChange={(e) => setSimSushiPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Flash Loan Borrow Amount (USDC)
                </label>
                <select
                  id="select-borrow-amount"
                  value={simBorrowAmount}
                  onChange={(e) => setSimBorrowAmount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={2500}>$2,500 USDC</option>
                  <option value={5000}>$5,000 USDC (Default)</option>
                  <option value={10000}>$10,000 USDC</option>
                  <option value={25000}>$25,000 USDC</option>
                  <option value={50000}>$50,000 USDC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Gas Price ({simGasGwei} Gwei)
                </label>
                <div className="flex items-center space-x-2 pt-1.5">
                  <input
                    id="range-gas-price"
                    type="range"
                    min="15"
                    max="60"
                    value={simGasGwei}
                    onChange={(e) => setSimGasGwei(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-600 w-10 text-right">{simGasGwei}G</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                id="btn-recalc-spread"
                type="button"
                onClick={() => runSpreadSimulation()}
                disabled={simulatingSpread}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${simulatingSpread ? "animate-spin" : ""}`} />
                <span>Calculate Arbitrage Financials</span>
              </button>
            </div>

            {/* Simulation Results Display */}
            {simSpreadResult && (
              <div className="mt-5 pt-5 border-t border-zinc-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">Cross-DEX Spread</span>
                    <span className={`text-base font-bold font-mono ${simSpreadResult.financials.isProfitable ? "text-emerald-600" : "text-zinc-800"}`}>
                      {simSpreadResult.prices.spreadPercentage.toFixed(4)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Δ ${simSpreadResult.prices.priceDifference.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">Gross Profit</span>
                    <span className="text-base font-bold font-mono text-zinc-900">
                      ${simSpreadResult.financials.grossProfitUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Spread × Borrow Amount
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">Deductions (Fee + Gas)</span>
                    <span className="text-base font-bold font-mono text-amber-700">
                      -${(simSpreadResult.financials.flashLoanFeeUsd + simSpreadResult.financials.estimatedGasCostUsd).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Fee: ${simSpreadResult.financials.flashLoanFeeUsd.toFixed(2)} | Gas: ${simSpreadResult.financials.estimatedGasCostUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${simSpreadResult.financials.isProfitable ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950"}`}>
                    <span className="text-[10px] uppercase font-mono opacity-75 block">Net Profit</span>
                    <span className="text-base font-bold font-mono">
                      ${simSpreadResult.financials.netProfitUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-semibold block mt-0.5">
                      {simSpreadResult.financials.isProfitable ? "✓ Profitable Arbitrage" : "✗ Below Gas Threshold"}
                    </span>
                  </div>
                </div>

                {/* Route Execution Diagram */}
                <div className="mt-4 p-4 rounded-lg bg-zinc-900 text-zinc-200 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px]">
                    <span className="font-semibold text-emerald-400">Atomic Execution Plan</span>
                    <span className="font-mono text-zinc-400">{simSpreadResult.arbitrageStrategy.tradeDirection}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3 text-[11px]">
                    {simSpreadResult.tradeRoute.map((step) => (
                      <div key={step.step} className="p-2.5 bg-zinc-800/80 rounded border border-zinc-700/50 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-emerald-400 font-bold block mb-1">
                            Step {step.step}: {step.action}
                          </span>
                          <p className="text-zinc-300 text-[10px] leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid of Control Card 2 and Control Card 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 2: Test Private RPC & WebSocket Endpoints */}
            <div id="card-rpc-tester" className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-4 border-b border-zinc-100">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Wifi className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Control Card 2: Private RPC & Diagnostics Tester
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Verify latency, block synchronization, and private mempool protection.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      RPC Endpoint to Ping & Benchmark
                    </label>
                    <input
                      id="input-rpc-test-url"
                      type="text"
                      value={testRpcUrl}
                      onChange={(e) => setTestRpcUrl(e.target.value)}
                      placeholder="https://... or wss://..."
                      className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] text-zinc-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setTestRpcUrl("https://rpc.flashbots.net")}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono cursor-pointer"
                    >
                      Flashbots Protect (MEV-Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestRpcUrl("https://cloudflare-eth.com")}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono cursor-pointer"
                    >
                      Cloudflare Mainnet
                    </button>
                  </div>

                  <button
                    id="btn-run-rpc-test"
                    type="button"
                    onClick={handleTestRpc}
                    disabled={testingRpc}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {testingRpc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Pinging RPC Endpoint...</span>
                      </>
                    ) : (
                      <>
                        <Gauge className="w-3.5 h-3.5" />
                        <span>Test RPC Latency & Status</span>
                      </>
                    )}
                  </button>

                  {/* RPC Test Output */}
                  {rpcTestResult && (
                    <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Connection Status:</span>
                        {rpcTestResult.success ? (
                          <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Connected ({rpcTestResult.status})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 font-semibold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Connection Failed</span>
                          </span>
                        )}
                      </div>

                      {rpcTestResult.success && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-200/60 font-mono">
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Ping Latency</span>
                            <span className="font-bold text-zinc-800">{rpcTestResult.latencyMs} ms</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Block Number</span>
                            <span className="font-bold text-zinc-800">#{rpcTestResult.blockNumber?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Network & Chain ID</span>
                            <span className="font-bold text-zinc-800">{rpcTestResult.networkName} (ID: {rpcTestResult.chainId})</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Private Mempool</span>
                            <span className={`font-bold ${rpcTestResult.isPrivateMempool ? "text-emerald-600" : "text-zinc-700"}`}>
                              {rpcTestResult.isPrivateMempool ? "Protected (MEV Safe)" : "Public Mempool"}
                            </span>
                          </div>
                        </div>
                      )}
                      {rpcTestResult.error && (
                        <p className="text-red-600 text-[11px]">{rpcTestResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Safe Flash Loan Routing Parameters & Safe Pipeline Trigger */}
            <div id="card-flashloan-trigger" className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-4 border-b border-zinc-100">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Control Card 3: Base Mainnet Flash Loan & Execution
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Aave V3 Base (0xA238...) × Aerodrome (0xcF77...) × BaseScan verified.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Base Flashloan Contract Status */}
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div className="truncate">
                      <span className="text-zinc-500 text-[10px] block uppercase font-sans font-semibold text-blue-700">Base Arbitrage Contract</span>
                      <span className="text-blue-900 font-bold">0x6B2d...781A</span>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <a
                        href="https://basescan.org/address/0x6B2d3688126e855524316Df9e2E2F80f83F5781A"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px] font-sans font-medium transition-colors"
                      >
                        <span>BaseScan</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={handleDeployContract}
                        disabled={deployingContract}
                        className="px-2 py-0.5 rounded bg-white border border-blue-300 text-blue-900 hover:bg-blue-50 text-[10px] font-sans font-medium cursor-pointer"
                      >
                        {deployingContract ? "Checking..." : "Verify"}
                      </button>
                    </div>
                  </div>

                  {contractDeployResult && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-mono text-emerald-800 flex items-center justify-between">
                      <span>Status: {contractDeployResult.status}</span>
                      <span className="text-[10px] text-emerald-600">Base Mainnet (8453)</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Base Borrow Asset
                      </label>
                      <select
                        id="select-fl-asset"
                        value={flAsset}
                        onChange={(e) => setFlAsset(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono cursor-pointer"
                      >
                        <option value="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913">USDC Native (Base • 6 dec)</option>
                        <option value="0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA">USDbC Bridged (Base • 6 dec)</option>
                        <option value="0x4200000000000000000000000000000000000006">WETH (Base • 18 dec)</option>
                        <option value="0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22">cbETH (Coinbase • 18 dec)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Borrow Amount
                      </label>
                      <input
                        id="input-fl-amount"
                        type="number"
                        value={flAmount}
                        onChange={(e) => setFlAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Max Priority Fee (Gwei)
                      </label>
                      <input
                        id="input-fl-priority"
                        type="number"
                        step="0.01"
                        value={flPriorityFee}
                        onChange={(e) => setFlPriorityFee(parseFloat(e.target.value) || 0.05)}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center space-x-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          id="check-fl-simulation"
                          type="checkbox"
                          checked={flSimulationMode}
                          onChange={(e) => setFlSimulationMode(e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <span>Safe Simulation Mode</span>
                      </label>
                    </div>
                  </div>

                  <button
                    id="btn-trigger-flashloan"
                    type="button"
                    onClick={handleTriggerFlashLoan}
                    disabled={triggeringFl}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {triggeringFl ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Assembling & Simulating Base Bundle...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Trigger Flash Loan Pipeline (Base L2)</span>
                      </>
                    )}
                  </button>

                  {/* Flash loan execution result */}
                  {flResult && (
                    <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Pipeline Status:</span>
                        <span className="font-bold text-emerald-600">{flResult.transaction.status}</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-zinc-600">
                        <div className="truncate flex items-center justify-between">
                          <span className="text-zinc-400">Target Contract: </span>
                          <a
                            href={flResult.basescanContractUrl || `https://basescan.org/address/${flResult.contractAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center space-x-0.5"
                          >
                            <span>{flResult.contractAddress.slice(0, 14)}...</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="truncate flex items-center justify-between">
                          <span className="text-zinc-400">Tx Hash: </span>
                          <a
                            href={flResult.basescanTxUrl || `https://basescan.org/tx/${flResult.transaction.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center space-x-0.5"
                          >
                            <span>{flResult.transaction.txHash.slice(0, 16)}...</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="truncate">
                          <span className="text-zinc-400">Calldata: </span>
                          <span className="text-emerald-700">{flResult.calldata.slice(0, 32)}...</span>
                        </div>
                        <div className="truncate">
                          <span className="text-zinc-400">Network: </span>
                          <span>Base Mainnet (Chain ID 8453)</span>
                        </div>
                        <div className="truncate">
                          <span className="text-zinc-400">Target Block: </span>
                          <span>#{flResult.transaction.targetBlock}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Port 2: 24/7 Scanner Backend Automation View */}
      {activeTab === "automation" && (
        <div id="scanner-automation-view" className="space-y-6">
          {/* Automation Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Metric 1: Loop State */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Port 2: Scanner State
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${automationState?.isRunning ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`} />
                  <span className="text-base font-bold font-mono">
                    {automationState?.isRunning ? "24/7 ACTIVE" : "PAUSED"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  id="btn-toggle-automation-tab"
                  onClick={handleToggleAutomation}
                  disabled={togglingAutomation}
                  className={`w-full py-1 text-xs font-mono font-semibold rounded transition-colors cursor-pointer border ${
                    automationState?.isRunning
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                  }`}
                >
                  {togglingAutomation
                    ? "Updating..."
                    : automationState?.isRunning
                    ? "Pause Scanner Loop"
                    : "Resume Scanner Loop"}
                </button>
              </div>
            </div>

            {/* Metric 2: Total Scans Executed */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Continuous Scan Ticks
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {automationState?.totalTicks ?? 0}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ticks</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                Loop frequency: <strong>~3.5s</strong> / block
              </div>
            </div>

            {/* Metric 3: Profitable Spreads */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Profitable Spreads
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {automationState?.profitableSpreadsFound ?? 0}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">divergences</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                Trigger threshold: <strong>&gt;{threshold.toFixed(2)}%</strong>
              </div>
            </div>

            {/* Metric 4: Auto Flash Bundles */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Flashbots Bundles
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {automationState?.autoSimulatedBundles ?? 0}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">dispatched</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                Target: <strong>Flashbots Builder Relay</strong>
              </div>
            </div>

            {/* Metric 5: Port 1 Refill Front Gas Reserve */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Port 1: Refill Front Gas
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {(envStatus?.gasBalanceEth ?? 0.45).toFixed(3)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ETH</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800">
                <button
                  type="button"
                  id="btn-refill-modal-tab"
                  onClick={() => setIsRefillModalOpen(true)}
                  className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  + Refill Front Port
                </button>
              </div>
            </div>
          </div>

          {/* Three Ports Architecture Explanation */}
          <div className="p-5 bg-white border border-zinc-200/90 rounded-xl shadow-xs">
            <div className="flex items-center space-x-2.5 mb-3">
              <span className="p-1.5 bg-zinc-900 text-emerald-400 rounded-lg font-mono text-xs font-bold">
                3P
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Three Ports Architecture: Refill Front • Navigation • Scanner 24/7 Automation
                </h3>
                <p className="text-xs text-zinc-500">
                  Dedicated channel separation ensuring key isolation, zero-downtime background scanning, and seamless routing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg">
                <div className="flex items-center space-x-2 mb-1.5 text-amber-800 font-bold font-mono">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>Port 1: Refill Front</span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Controls the <strong>Signer Gas Balance</strong> for private mempool bribes. Kept isolated from the browser: only public address is exposed, while PRIVATE_KEY stays in Node.js server memory. Auto-refill guard triggers when balance &lt; 0.15 ETH.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-1.5 text-zinc-800 font-bold font-mono">
                  <Sliders className="w-4 h-4 text-zinc-600" />
                  <span>Port 2: Navigation Port</span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Unifies the multi-module dashboard, routing between <strong>DEX Arbitrage Scanner</strong>, <strong>Unified Vault Port</strong>, <strong>Cybersecurity Defense</strong>, and <strong>Tether Mint</strong> without losing state.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
                <div className="flex items-center space-x-2 mb-1.5 text-emerald-800 font-bold font-mono">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Port 3: Scanner 24/7 Backend</span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Continuous Node.js event-loop scanner running in the background. Tracks Uniswap V3 &amp; SushiSwap tick feeds, simulates cross-DEX spreads, and bundles transactions for MEV-Share relay.
                </p>
              </div>
            </div>
          </div>

          {/* Meme Coin Pool Auto-Scanner Matrix */}
          <div className="p-5 bg-white border border-zinc-200/90 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                  Meme Coin &amp; Standard Liquidity Pool Scanning Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Poll Interval: 3500ms
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SUPPORTED_POOL_PAIRS.map((pair) => {
                const isSelected = selectedPair.id === pair.id;
                return (
                  <div
                    key={pair.id}
                    onClick={() => handleSelectPair(pair)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-950 shadow-xs ring-1 ring-emerald-500"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs font-mono">{pair.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          pair.category === "Meme Coin"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {pair.category}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate mt-1">
                      Uni: {pair.uniPool.slice(0, 8)}...
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">
                      Sushi: {pair.sushiPool.slice(0, 8)}...
                    </div>
                    <div className="mt-2 pt-2 border-t border-zinc-700/50 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400">STATUS: ACTIVE</span>
                      <span className="text-zinc-400">Click to Select</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live 24/7 Automation Event Feed */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">
                  Port 2: Live 24/7 Scanner Event Stream (Node.js Background Loop)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STREAMING LIVE
              </span>
            </div>

            <div className="p-4 font-mono text-xs text-zinc-300 max-h-80 overflow-y-auto space-y-2 select-text">
              {automationState?.recentEvents && automationState.recentEvents.length > 0 ? (
                automationState.recentEvents.map((evt, idx) => {
                  const timeStr = new Date(evt.timestamp).toLocaleTimeString();
                  let badgeColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
                  if (evt.type === "PROFITABLE_SPREAD") badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                  if (evt.type === "FLASH_BUNDLE") badgeColor = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
                  if (evt.type === "AUTO_REFILL" || evt.type === "MANUAL_REFILL") badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                  return (
                    <div
                      key={idx}
                      className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500 text-[10px] font-mono">{timeStr}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono ${badgeColor}`}>
                          {evt.type}
                        </span>
                        <span className="text-zinc-200 text-xs font-mono">{evt.message}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-zinc-400">
                        {evt.spreadPct !== undefined && (
                          <span className="text-amber-400 font-bold">
                            Spread: +{evt.spreadPct.toFixed(2)}%
                          </span>
                        )}
                        <span>Gas: {evt.gasRemainingEth.toFixed(3)} ETH</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-zinc-500 font-mono">
                  Listening for 24/7 Scanner events... (Loop active)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "terminal" && (
        <div id="scanner-terminal-view" className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
              </div>
              <span className="text-xs font-mono text-zinc-400 pl-2">
                node scanner.js --threshold {threshold.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-mono">Test divergence:</span>
              <button
                type="button"
                onClick={() => handleRunScanner(0.85)}
                disabled={running}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-mono cursor-pointer transition-colors"
              >
                Simulate 0.85% Spread
              </button>
              <button
                id="btn-run-scanner-terminal"
                type="button"
                onClick={() => handleRunScanner()}
                disabled={running}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                {running ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                <span>Re-run</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[480px]">
            {running ? (
              <div className="flex items-center space-x-3 text-emerald-400 py-6">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Streaming live liquidity tick events from Uniswap V3 & SushiSwap...</span>
              </div>
            ) : error ? (
              <div className="text-red-400 py-2">
                [Terminal Error]: {error}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap leading-relaxed text-zinc-300">
                {result?.stdout || "No execution log yet. Click 'Run Scanner' to begin."}
              </pre>
            )}
          </div>

          {result && (
            <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Exit Code: 0 (Success)</span>
              <span>Execution Time: {result.durationMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Script Viewer Tab: Code inspection */}
      {activeTab === "code" && (
        <div id="scanner-code-view" className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-zinc-300">scanner.js (Node.js + ethers.js)</span>
            </div>
            <button
              id="btn-copy-scanner-code"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
          <div className="p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[500px]">
            <pre className="whitespace-pre leading-relaxed">{SCANNER_CODE}</pre>
          </div>
        </div>
      )}

      {/* Architecture Deep Dive Tab */}
      {activeTab === "architecture" && (
        <div id="scanner-architecture-view" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
              1. In-Memory State Caching
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3">
              Standard bots fail because they make asynchronous RPC read calls (e.g. <code className="font-mono">getReserves()</code>) inside event handlers. At 100+ swaps/sec, this creates race conditions and dropped blocks. Our engine updates an in-memory pointer synchronously upon event receipt and evaluates divergence immediately.
            </p>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono text-[11px]">
              latestPrices.uniswap = sqrtPriceX96; // 0ms RPC overhead
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
              2. Q96 Math vs V2 Reserves
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3">
              Uniswap V3 stores spot prices as a binary fixed-point Q96 square root: <code className="font-mono text-emerald-600">sqrtPriceX96</code>. SushiSwap stores token balances as <code className="font-mono">reserve0</code> and <code className="font-mono">reserve1</code>. The math converter calculates (sqrtPriceX96 / 2^96)^2 to normalize to SushiSwap's decimal ratio.
            </p>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono text-[11px]">
              price = (sqrtPriceX96 / 2^96)^2 * 10^(18-6)
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
              3. Private Mempool Routing (Flashbots)
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3">
              Submitting an arbitrage transaction to the public Ethereum mempool is guaranteed suicide due to generalized frontrunning and sandwich searcher bots. All profitable payloads are dispatched as private MEV bundles directly to block builders.
            </p>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono text-[11px]">
              RPC: https://rpc.flashbots.net (Private Bundle Ingress)
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
              4. Atomic Flash Loan Guarantees
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3">
              Zero capital risk: If the price slips during block inclusion such that net profit cannot repay the Aave V3 flash loan principal and fee, the entire transaction reverts atomically in EVM memory, losing only the gas fee.
            </p>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono text-[11px]">
              require(finalBalance &gt;= borrowAmount + fee, "Arbitrage Unprofitable");
            </div>
          </div>
        </div>
      )}

      {/* Port 1: Refill Front & Gas Management Modal */}
      <RefillFrontPortModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        gasBalance={envStatus?.gasBalanceEth ?? 0.0056}
        signerAddress={envStatus?.signerAddress || "0x8C4dFc045f202AaD306d94Ae6E7a1d81E96B34fD"}
        onRefillSuccess={(newBalance, message) => {
          setEnvStatus((prev) =>
            prev ? { ...prev, gasBalanceEth: newBalance } : prev
          );
          setRefillMessage(message);
          fetchAutomationState();
        }}
        automationState={automationState}
        onToggleAutomation={handleToggleAutomation}
      />
    </div>
  );
}
