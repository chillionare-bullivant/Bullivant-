import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const startTime = Date.now();
  try {
    const blocksCount = Math.min(Math.max(parseInt(req.query?.blocks || "24", 10), 5), 100);
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    let providerType = "Base Public Gateway";
    let feeHistory: any = null;

    if (alchemyKey && alchemyKey !== "demo") {
      try {
        const alchemy = new Alchemy({
          apiKey: alchemyKey,
          network: Network.BASE_MAINNET,
        });
        feeHistory = await alchemy.core.send("eth_feeHistory", [blocksCount, "latest", [10, 50, 90]]);
        providerType = "Alchemy SDK (Base Mainnet)";
      } catch (_e) {
        // Fallback
      }
    }

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
        // Fallback
      }
    }

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

    return res.status(200).json({
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
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to query Base gas history via Alchemy",
    });
  }
}
