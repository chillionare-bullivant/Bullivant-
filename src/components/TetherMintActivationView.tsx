import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Layers,
  FileCode,
  Terminal,
  Key,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Lock,
  Wallet,
} from "lucide-react";

interface MintRecord {
  id: string;
  amountUsd: number;
  network: string;
  txHash: string;
  blockNumber: number;
  confirmations: number;
  finalityTime: string;
  timestamp: number;
  wireRef: string;
}

interface NetworkProfile {
  network: string;
  blockTime: string;
  blocksRequired: number;
  finalityTime: string;
  feeUsd: number;
}

interface TetherStatusResponse {
  success: boolean;
  walletAddress: string;
  fiatBalanceUsd: number;
  requiredThresholdUsd: number;
  deficitUsd: number;
  isThresholdMet: boolean;
  nodeStatus: string;
  nodeActivated: boolean;
  sUsdtBalance: number;
  totalMintedUsd: number;
  kycStatus: string;
  reserveBank: string;
  contractAddress: string;
  simulatedContractAddress: string;
  networkProfiles: NetworkProfile[];
  mints: MintRecord[];
}

export function TetherMintActivationView() {
  const [data, setData] = useState<TetherStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customDeposit, setCustomDeposit] = useState<string>("55000");
  const [depositing, setDepositing] = useState<boolean>(false);
  const [depositNotification, setDepositNotification] = useState<string | null>(null);

  // Mint Form
  const [selectedNetwork, setSelectedNetwork] = useState<string>("Ethereum (ERC-20)");
  const [mintAmount, setMintAmount] = useState<string>("100000");
  const [minting, setMinting] = useState<boolean>(false);
  const [mintStage, setMintStage] = useState<number>(0); // 0=idle, 1=kyc, 2=wire, 3=multisig, 4=blockchain
  const [mintSuccessMsg, setMintSuccessMsg] = useState<string | null>(null);

  // Code Tab
  const [codeTab, setCodeTab] = useState<"solidity" | "node-script" | "cli">("solidity");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // CLI Runner
  const [cliRunning, setCliRunning] = useState<boolean>(false);
  const [cliOutput, setCliOutput] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/tether/status").catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success) {
          setData(json);
        }
      }
    } catch (_err) {
      // Handled gracefully during offline or initial server startup
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDeposit = async (amountNum: number) => {
    setDepositing(true);
    setDepositNotification(null);
    try {
      const res = await fetch("/api/tether/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });
      const result = await res.json();
      if (result.success) {
        setDepositNotification(result.message);
        fetchStatus();
      }
    } catch (err) {
      console.error("Deposit error:", err);
    } finally {
      setDepositing(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("/api/tether/reset", { method: "POST" });
      setDepositNotification("Demo reset: Wallet balance restored to $45,000 USD.");
      fetchStatus();
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const handleExecuteMint = async () => {
    if (!data || !data.isThresholdMet) return;
    setMinting(true);
    setMintSuccessMsg(null);
    setMintStage(1);

    // Simulate 4-phase progression
    setTimeout(() => setMintStage(2), 700);
    setTimeout(() => setMintStage(3), 1500);
    setTimeout(() => setMintStage(4), 2200);

    try {
      const res = await fetch("/api/tether/execute-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(mintAmount),
          network: selectedNetwork,
          recipientWallet: data.walletAddress,
        }),
      });
      const result = await res.json();
      setTimeout(() => {
        if (result.success) {
          setMintSuccessMsg(result.message);
          fetchStatus();
        }
        setMinting(false);
        setMintStage(0);
      }, 3000);
    } catch (err) {
      console.error("Mint error:", err);
      setMinting(false);
      setMintStage(0);
    }
  };

  const handleRunCli = async () => {
    setCliRunning(true);
    setCodeTab("cli");
    setCliOutput("⏳ Executing `node tether-mint-simulator.js`...\nEvaluating balance threshold, verifying SWIFT wire, and calling contract mint()...");
    try {
      const balanceToPass = data ? data.fiatBalanceUsd : 100000;
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: "tether-mint-simulator.js",
          args: `${balanceToPass}`,
        }),
      });
      const result = await res.json();
      if (result.stdout) {
        setCliOutput(result.stdout);
      } else if (result.stderr) {
        setCliOutput("Error:\n" + result.stderr);
      }
    } catch (err: any) {
      setCliOutput("Execution failed: " + err?.message);
    } finally {
      setCliRunning(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const balancePercent = data
    ? Math.min(100, Math.round((data.fiatBalanceUsd / data.requiredThresholdUsd) * 100))
    : 45;

  const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimulatedTether (sUSDT)
 * @notice Replicates Tether Treasury's official smart contract setup:
 *         Only approved institutional clients with verified fiat deposits ($100k min)
 *         can trigger token issuance backed 1:1 by reserve bank holdings.
 */
contract SimulatedTether {
    string public name = "Simulated Tether";
    string public symbol = "sUSDT";
    uint8 public decimals = 6; // USDT standard: 6 decimals
    uint256 public totalSupply;

    address public treasuryOwner;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    modifier onlyTreasury() {
        require(msg.sender == treasuryOwner, "Only Tether Treasury can execute this");
        _;
    }

    constructor() {
        treasuryOwner = msg.sender; // Deployer acts as Tether Multi-Sig Treasury
    }

    // Replicates on-chain trigger after a $100k+ SWIFT wire clears in Tether Reserve Bank
    function mint(address to, uint256 amount) external onlyTreasury {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Mint amount must be > 0");

        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    // Replicates burn when client redeems fiat from reserves
    function burn(address from, uint256 amount) external onlyTreasury {
        require(balanceOf[from] >= amount, "Insufficient balance to burn");

        balanceOf[from] -= amount;
        totalSupply -= amount;

        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
    }
}`;

  const NODE_SCRIPT_CODE = `const { ethers } = require("ethers");

// 1. Setup provider and Tether Treasury signer
const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com"); 
const treasurySigner = "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828";

// 2. Simulated Contract Details
const contractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const contractABI = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)"
];

async function simulateMintingLifecycle(walletBalanceUsd, clientAddress) {
    const REQUIRED_THRESHOLD = 100000; // $100,000 USD Minimum
    
    console.log("🔍 Checking balance threshold...");
    if (walletBalanceUsd < REQUIRED_THRESHOLD) {
        console.log(\`❌ INSUFFICIENT BALANCE: \${walletBalanceUsd} < \${REQUIRED_THRESHOLD}\`);
        console.log("   Node activation paused until balance reaches $100k.");
        return;
    }

    console.log("✅ Threshold met! Activating Institutional Node...");
    console.log("⏳ [Phase 1]: KYC Tier 3 verification cleared.");
    console.log("🏦 [Phase 2]: \$100,000 USD SWIFT Wire cleared in Tether Reserve Bank.");
    console.log("🔐 [Phase 3]: Multi-sig Treasury authorized mint transaction.");
    console.log("⛓️ [Phase 4]: Broadcasted to blockchain! Minted in Block #26018231.");
    console.log("💰 Client Balance: 100,000 sUSDT (Backed 1:1 by US Treasuries)");
}

simulateMintingLifecycle(100000, "0x71C2B04E5B8618e4708Ac6395Fc2d0e704176B28");`;

  return (
    <div id="tether-mint-view" className="space-y-6">
      {/* Top Banner: Status & Threshold Indicator */}
      <div
        id="tether-header-card"
        className={`p-5 rounded-2xl border transition-all ${
          data?.isThresholdMet
            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-900"
            : "bg-amber-950/15 border-amber-500/30 text-amber-900"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2.5 rounded-xl ${
                data?.isThresholdMet
                  ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/40"
                  : "bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/40"
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                  Tether Institutional Minting Node & Balance Radar
                </h2>
                <span
                  id="node-activation-badge"
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    data?.isThresholdMet
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {data?.isThresholdMet ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                      NODE ACTIVATED (INSTITUTIONAL READY)
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                      STANDBY (INSUFFICIENT BALANCE)
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                Minimum Deposit Requirement:{" "}
                <span className="font-semibold text-zinc-800">$100,000 USD</span>. Only approved institutional
                entities can trigger direct reserve-backed token creation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              id="run-cli-simulator-btn"
              type="button"
              onClick={handleRunCli}
              disabled={cliRunning}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{cliRunning ? "Executing..." : "Run CLI Script"}</span>
            </button>
            <button
              id="refresh-tether-btn"
              type="button"
              onClick={fetchStatus}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar towards $100k */}
        <div className="mt-4 pt-4 border-t border-zinc-200/60">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-zinc-600">
              Current Wallet Balance:{" "}
              <strong className="text-zinc-900 text-sm">
                ${data ? data.fiatBalanceUsd.toLocaleString() : "45,000"} USD
              </strong>
            </span>
            <span className="text-zinc-600">
              Threshold:{" "}
              <strong className="text-zinc-900 font-mono">
                ${data ? data.requiredThresholdUsd.toLocaleString() : "100,000"} USD
              </strong>{" "}
              ({balancePercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                data?.isThresholdMet
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-amber-500 to-amber-400"
              }`}
              style={{ width: `${balancePercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-[11px] text-zinc-500">
            <span>
              {data?.isThresholdMet ? (
                <span className="text-emerald-700 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />
                  Threshold requirement satisfied. Node is active for on-chain minting.
                </span>
              ) : (
                <span className="text-amber-700 font-medium flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600 inline" />
                  Deficit: ${data ? data.deficitUsd.toLocaleString() : "55,000"} USD remaining to activate node.
                </span>
              )}
            </span>
            <span className="text-zinc-400 font-mono">Wallet: {data?.walletAddress.slice(0, 10)}...</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {depositNotification && (
        <div
          id="deposit-notification-banner"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-fade-in"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{depositNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setDepositNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Controls & Right Lifecycle Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet Deposit Radar & Node Trigger (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Deposit & Activation Radar Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-900">Wallet Balance & Node Trigger</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
              >
                Reset to $45k
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Simulate international bank wires hitting your wallet to trigger the threshold check and
              activate the Tether institutional node in real time:
            </p>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                id="deposit-25k-btn"
                type="button"
                onClick={() => handleDeposit(25000)}
                disabled={depositing}
                className="px-2.5 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-center text-xs font-semibold text-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                +$25,000
                <span className="block text-[10px] font-normal text-zinc-500">Partial Wire</span>
              </button>
              <button
                id="deposit-55k-btn"
                type="button"
                onClick={() => handleDeposit(55000)}
                disabled={depositing}
                className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                +$55,000
                <span className="block text-[10px] font-normal text-emerald-600">Reaches $100k!</span>
              </button>
              <button
                id="deposit-100k-btn"
                type="button"
                onClick={() => handleDeposit(100000)}
                disabled={depositing}
                className="px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-center text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                +$100,000
                <span className="block text-[10px] font-normal text-zinc-400">Full Inst. Wire</span>
              </button>
            </div>

            {/* Custom Amount Form */}
            <div className="pt-2 border-t border-zinc-100 flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">$</span>
                <input
                  id="custom-deposit-input"
                  type="number"
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(e.target.value)}
                  placeholder="Deposit USD"
                  className="w-full pl-6 pr-3 py-1.5 text-xs font-mono border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                id="transmit-wire-btn"
                type="button"
                onClick={() => handleDeposit(parseFloat(customDeposit) || 0)}
                disabled={depositing || !customDeposit}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {depositing ? "Wiring..." : "Wire USD"}
              </button>
            </div>

            {/* Key Institutions & Bank Info */}
            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[11px] space-y-1.5 text-zinc-600">
              <div className="flex justify-between">
                <span className="text-zinc-500">Compliance & KYC:</span>
                <span className="font-semibold text-emerald-700">Tier 3 Verified (Corporate)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Account Fee:</span>
                <span className="font-semibold text-zinc-700">$150 Paid (Tether Setup)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fiat Deposit Fee:</span>
                <span className="font-semibold text-zinc-700">0.10% ($100 per $100k)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Custodial Reserve Bank:</span>
                <span className="font-semibold text-zinc-800">Cantor Fitzgerald / Deltec</span>
              </div>
            </div>
          </div>

          {/* Direct Mint Execution Form */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-900">Execute Institutional Mint</h3>
              </div>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 font-mono px-2 py-0.5 rounded">
                sUSDT (6 decimals)
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">Target Blockchain</label>
                <select
                  id="target-network-select"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Ethereum (ERC-20)">Ethereum (ERC-20) - 12 to 20 Blocks (~3 min)</option>
                  <option value="TRON (TRC-20)">TRON (TRC-20) - 1 Block (~3 seconds)</option>
                  <option value="Solana (SPL)">Solana (SPL) - 1 Block (~0.4s Instant)</option>
                  <option value="Arbitrum One (L2)">Arbitrum One (L2) - 1 Block (Sub-second)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">Mint Amount (USD)</label>
                <input
                  id="mint-amount-input"
                  type="number"
                  min="100000"
                  step="10000"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Enforces strict $100,000 institutional floor. Minimum deposit cannot be bypassed.
                </p>
              </div>

              <button
                id="execute-mint-btn"
                type="button"
                onClick={handleExecuteMint}
                disabled={minting || !data?.isThresholdMet}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  data?.isThresholdMet
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {minting
                    ? `Phase ${mintStage}/4 Processing...`
                    : data?.isThresholdMet
                    ? "Execute Direct Mint Transaction"
                    : "Node Inactive (Deposit $100k to Activate)"}
                </span>
              </button>

              {mintSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <div className="font-semibold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Minting Completed Successfully!
                  </div>
                  <div className="text-[11px] mt-1">{mintSuccessMsg}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4-Phase Lifecycle & Network Block Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* The 4-Phase Lifecycle Timeline Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  The 4-Phase Institutional Minting Lifecycle
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  How traditional fiat banking rails interface with on-chain smart contract triggers
                </p>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">SWIFT ──&gt; EVM</span>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  mintStage === 1
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                    : "bg-zinc-50/70 border-zinc-200/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Phase 1 (One-Time)
                  </span>
                  <span className="text-[11px] text-zinc-500">Days to Weeks</span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
                  Compliance & KYC/AML
                </h4>
                <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                  Corporate documents & UBO records verified. $150 verification fee paid. Strict regulatory gate
                  excluding retail users.
                </p>
              </div>

              {/* Step 2 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  mintStage === 2
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                    : "bg-zinc-50/70 border-zinc-200/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Phase 2 (Off-Chain)
                  </span>
                  <span className="text-[11px] text-zinc-500">1 to 3 Days</span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                  SWIFT Fiat Wire ($100k+)
                </h4>
                <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                  International wire sent to Tether reserve bank account (Deltec / Cantor Fitzgerald). Funds
                  held 1:1 in cash and short-term US T-bills.
                </p>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  mintStage === 3
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                    : "bg-zinc-50/70 border-zinc-200/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Phase 3 (Authorization)
                  </span>
                  <span className="text-[11px] text-zinc-500">Few Hours</span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 flex items-center">
                  <Key className="w-3.5 h-3.5 text-purple-600 mr-1.5 shrink-0" />
                  Treasury Multi-Sig Trigger
                </h4>
                <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                  Tether treasury confirms receipt in reserve bank and authorizes multi-signature key to call the{" "}
                  <code className="text-[10px] bg-zinc-200/60 px-1 py-0.5 rounded font-mono">mint()</code>{" "}
                  function.
                </p>
              </div>

              {/* Step 4 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  mintStage === 4
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30"
                    : "bg-zinc-50/70 border-zinc-200/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Phase 4 (On-Chain)
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">1 to 20 Blocks</span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 flex items-center">
                  <Layers className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
                  Blockchain Finality & Delivery
                </h4>
                <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                  Smart contract emits <code className="font-mono">Mint</code> and{" "}
                  <code className="font-mono">Transfer</code> events. Newly created tokens hit client wallet in 1
                  block (TRON/Solana) or 12 blocks (Ethereum).
                </p>
              </div>
            </div>
          </div>

          {/* Network-by-Network Comparison Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <h3 className="text-sm font-semibold text-zinc-900">
                Network Comparison: Block Times & Confirmations
              </h3>
              <span className="text-[11px] text-zinc-500">Speed vs Security</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 text-[11px]">
                    <th className="py-2 font-medium">Blockchain Network</th>
                    <th className="py-2 font-medium">Block Time</th>
                    <th className="py-2 font-medium">Blocks for 1 Tx</th>
                    <th className="py-2 font-medium">Total Finality Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 font-sans font-medium text-zinc-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      TRON (TRC-20)
                      <span className="ml-1.5 text-[10px] text-zinc-400 font-normal">#1 Volume</span>
                    </td>
                    <td className="py-2.5 text-zinc-600">~3 seconds</td>
                    <td className="py-2.5 text-zinc-600">1 block</td>
                    <td className="py-2.5 text-emerald-600 font-semibold font-sans">~3 seconds (Instant)</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 font-sans font-medium text-zinc-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                      Solana (SPL)
                    </td>
                    <td className="py-2.5 text-zinc-600">~0.4 seconds</td>
                    <td className="py-2.5 text-zinc-600">1 block</td>
                    <td className="py-2.5 text-emerald-600 font-semibold font-sans">&lt;1 second (Ultra-Fast)</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 font-sans font-medium text-zinc-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      Ethereum (ERC-20)
                    </td>
                    <td className="py-2.5 text-zinc-600">~12 seconds</td>
                    <td className="py-2.5 text-zinc-600">1 block</td>
                    <td className="py-2.5 text-amber-700 font-semibold font-sans">
                      12 to 20 blocks (2 to 4 min)
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 font-sans font-medium text-zinc-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2" />
                      Arbitrum / Optimism (L2)
                    </td>
                    <td className="py-2.5 text-zinc-600">Sub-second</td>
                    <td className="py-2.5 text-zinc-600">1 block</td>
                    <td className="py-2.5 text-emerald-600 font-semibold font-sans">Sub-second</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Code & Terminal Inspector */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-semibold text-zinc-900">Solidity & Ethers.js Implementation</h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-zinc-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setCodeTab("solidity")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  codeTab === "solidity" ? "bg-white font-medium text-zinc-900 shadow-2xs" : "text-zinc-600"
                }`}
              >
                SimulatedTether.sol
              </button>
              <button
                type="button"
                onClick={() => setCodeTab("node-script")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  codeTab === "node-script" ? "bg-white font-medium text-zinc-900 shadow-2xs" : "text-zinc-600"
                }`}
              >
                tether-mint-simulator.js
              </button>
              <button
                type="button"
                onClick={() => setCodeTab("cli")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  codeTab === "cli" ? "bg-white font-medium text-zinc-900 shadow-2xs" : "text-zinc-600"
                }`}
              >
                CLI Terminal Output
              </button>
            </div>

            {codeTab !== "cli" && (
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(codeTab === "solidity" ? SOLIDITY_CODE : NODE_SCRIPT_CODE, codeTab)
                }
                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode === codeTab ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {codeTab === "solidity" && (
          <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            {SOLIDITY_CODE}
          </pre>
        )}

        {codeTab === "node-script" && (
          <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            {NODE_SCRIPT_CODE}
          </pre>
        )}

        {codeTab === "cli" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Live stdout from Node.js runtime</span>
              <button
                type="button"
                onClick={handleRunCli}
                disabled={cliRunning}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {cliRunning ? "Running..." : "Re-run node script"}
              </button>
            </div>
            <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
              {cliOutput || "Click 'Run CLI Script' above to execute `node tether-mint-simulator.js`"}
            </pre>
          </div>
        )}
      </div>

      {/* Mint History Audit Trail */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <h3 className="text-sm font-semibold text-zinc-900">Institutional Mint History & Audit Trail</h3>
          <span className="text-[11px] text-zinc-500 font-mono">1:1 US Treasury Backed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 text-[11px]">
                <th className="py-2 font-medium">Timestamp</th>
                <th className="py-2 font-medium">Wire Ref</th>
                <th className="py-2 font-medium">Amount Minted</th>
                <th className="py-2 font-medium">Network</th>
                <th className="py-2 font-medium">Tx Hash</th>
                <th className="py-2 font-medium">Block & Finality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
              {data && data.mints && data.mints.length > 0 ? (
                data.mints.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 text-zinc-500 font-sans">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-zinc-700 font-semibold">{m.wireRef}</td>
                    <td className="py-2.5 text-emerald-600 font-bold">
                      +{m.amountUsd.toLocaleString()} sUSDT
                    </td>
                    <td className="py-2.5 text-zinc-700 font-sans">{m.network}</td>
                    <td className="py-2.5 text-zinc-500">
                      <span className="flex items-center space-x-1">
                        <span>{m.txHash.slice(0, 10)}...</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.txHash, m.id)}
                          className="hover:text-zinc-900 cursor-pointer"
                        >
                          {copiedCode === m.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-700">
                      Block #{m.blockNumber}{" "}
                      <span className="text-[10px] text-zinc-400">({m.confirmations} confs)</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-400 font-sans text-xs">
                    No mint transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
