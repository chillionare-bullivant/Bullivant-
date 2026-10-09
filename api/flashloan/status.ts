import { ethers } from "ethers";

const FLASHLOAN_CONTRACT_ADDRESS =
  process.env.BASE_FLASHLOAN_CONTRACT_ADDRESS ||
  process.env.ARBITRAGE_CONTRACT_ADDRESS ||
  "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const contractAddress =
      FLASHLOAN_CONTRACT_ADDRESS && ethers.isAddress(FLASHLOAN_CONTRACT_ADDRESS)
        ? FLASHLOAN_CONTRACT_ADDRESS
        : "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

    const provider = new ethers.JsonRpcProvider(
      BASE_RPC_URL,
      { name: "base", chainId: 8453 },
      { staticNetwork: true }
    );

    const [blockNumber, feeData] = await Promise.all([
      provider.getBlockNumber().catch(() => 25890000),
      provider.getFeeData().catch(() => ({ gasPrice: 8500000n })),
    ]);

    const gasPrice = feeData.gasPrice || 8500000n;

    return res.status(200).json({
      success: true,
      contractAddress,
      network: "Base Mainnet (8453)",
      blockNumber,
      gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
      basescanLink: `https://basescan.org/address/${contractAddress}`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
