import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const blocksCount = Math.min(Math.max(parseInt(searchParams.get("blocks") || "24", 10), 5), 100);
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    let providerType = "Base Public Gateway";
    let feeHistory: any = null;

    // 1. Try with Alchemy SDK if API key is present
    if (alchemyKey && alchemyKey !== "demo") {
      try {
        const alchemy = new Alchemy({
          apiKey: alchemyKey,
          network: Network.BASE_MAINNET,
        });
        feeHistory = await alchemy.core.send("eth_feeHistory", [blocksCount, "latest", [10, 50, 90]]);
        providerType = "Alchemy SDK (Base Mainnet)";
      } catch (_e) {
        // Fallback to RPC provider
      }
    }

    // 2. Try Alchemy RPC Gateway if SDK failed
    if (!feeHistory && alchemyKey && alchemyKey !== "demo") {
      try {
        const alchemyProvider = new ethers.JsonRpcProvider(
          `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
          { name: "base", chainId: 8453 },
          { staticNetwork: true }
        );
        feeHistory = await alchemyProvider.send("eth_feeHistory", [blocksCount, "latest", [10, 50, 90]]);
        providerType = "Alchemy Base RPC Gateway";
      } catch (_err) {
        // Fallback to public gateway
      }
    }

    // 3. Fallback to public Base gateway
    if (!feeHistory) {
      const publicProvider = new ethers.JsonRpcProvider(
        "https://mainnet.base.org",
        { name: "base", chainId: 8453 },
        { staticNetwork: true }
      );
      feeHistory = await publicProvider.send("eth_feeHistory", [blocksCount, "latest", [10, 50, 90]]);
      providerType = alchemyKey ? "Base Public Gateway (Alchemy Fallback)" : "Base Public Gateway";
    }

    const oldestBlock = parseInt(feeHistory.oldestBlock, 16);
    const historyData: Array<{
      blockNumber: number;
      baseFeeGwei: number;
      priorityFeeGwei: number;
      totalGasPriceGwei: number;
      gasUsedRatio: number;
      estimatedTxCostUsd: number;
      timestamp: string;
    }> = [];

    const ethPriceUsd = 2200;

    for (let i = 0; i < feeHistory.baseFeePerGas.length - 1; i++) {
      const baseFeeWei = BigInt(feeHistory.baseFeePerGas[i]);
      const baseFeeGwei = parseFloat(ethers.formatUnits(baseFeeWei, "gwei"));

      let priorityGwei = 0.001;
      if (feeHistory.reward && feeHistory.reward[i] && feeHistory.reward[i][1]) {
        priorityGwei = parseFloat(ethers.formatUnits(BigInt(feeHistory.reward[i][1]), "gwei"));
      }

      const totalGwei = parseFloat((baseFeeGwei + priorityGwei).toFixed(5));
      const gasUsedPercent =
        feeHistory.gasUsedRatio && feeHistory.gasUsedRatio[i] !== undefined
          ? parseFloat((feeHistory.gasUsedRatio[i] * 100).toFixed(1))
          : 50.0;

      const txCostEth = totalGwei * 1e-9 * 21000;
      const txCostUsd = parseFloat((txCostEth * ethPriceUsd).toFixed(6));

      const secondsAgo = (feeHistory.baseFeePerGas.length - 1 - i) * 2;
      const timeLabel = secondsAgo === 0 ? "Now" : `-${secondsAgo}s`;

      historyData.push({
        blockNumber: oldestBlock + i,
        baseFeeGwei: parseFloat(baseFeeGwei.toFixed(5)),
        priorityFeeGwei: parseFloat(priorityGwei.toFixed(5)),
        totalGasPriceGwei: totalGwei,
        gasUsedRatio: gasUsedPercent,
        estimatedTxCostUsd: txCostUsd,
        timestamp: timeLabel,
      });
    }

    const totalGasPrices = historyData.map((d) => d.totalGasPriceGwei);
    const currentGasPrice = totalGasPrices[totalGasPrices.length - 1] || 0.006;
    const averageGasPrice = parseFloat(
      (totalGasPrices.reduce((a, b) => a + b, 0) / (totalGasPrices.length || 1)).toFixed(5)
    );
    const minGasPrice = Math.min(...totalGasPrices);
    const maxGasPrice = Math.max(...totalGasPrices);

    let congestionLevel: "Low" | "Moderate" | "Elevated" | "Congested" = "Low";
    if (currentGasPrice > 0.1) congestionLevel = "Congested";
    else if (currentGasPrice > 0.03) congestionLevel = "Elevated";
    else if (currentGasPrice > 0.01) congestionLevel = "Moderate";

    const flashLoanGasCostEth = currentGasPrice * 1e-9 * 450000;
    const flashLoanGasCostUsd = parseFloat((flashLoanGasCostEth * ethPriceUsd).toFixed(5));
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        network: "Base Mainnet (Chain ID 8453)",
        providerType,
        alchemySdkVersion: "^3.6.5",
        latencyMs,
        currentGasPriceGwei: currentGasPrice,
        averageGasPriceGwei: averageGasPrice,
        minGasPriceGwei: minGasPrice,
        maxGasPriceGwei: maxGasPrice,
        congestionLevel,
        flashLoanGasCostUsd,
        flashLoanGasCostEth: parseFloat(flashLoanGasCostEth.toFixed(8)),
        standardTxCostUsd: historyData[historyData.length - 1]?.estimatedTxCostUsd || 0.0003,
        history: historyData,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to query Base gas history via Alchemy" },
      { status: 500, headers: corsHeaders }
    );
  }
}
