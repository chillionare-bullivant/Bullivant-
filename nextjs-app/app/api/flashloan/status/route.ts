import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const FLASHLOAN_CONTRACT_ADDRESS =
  process.env.BASE_FLASHLOAN_CONTRACT_ADDRESS ||
  process.env.ARBITRAGE_CONTRACT_ADDRESS ||
  "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

// Minimal ABI for flash loan contract
const FLASHLOAN_ABI = [
  "function requestFlashLoanUSDC(uint256 amount) external",
  "function requestFlashLoanWETH(uint256 amount) external",
  "function getBalance(address token) view returns (uint256)",
  "event FlashLoanRequested(address indexed asset, uint256 amount)",
  "event FlashLoanExecuted(address indexed asset, uint256 amount, uint256 premium)",
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  try {
    const contractAddress =
      FLASHLOAN_CONTRACT_ADDRESS && ethers.isAddress(FLASHLOAN_CONTRACT_ADDRESS)
        ? FLASHLOAN_CONTRACT_ADDRESS
        : "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return NextResponse.json(
        { success: false, error: "Flash loan contract not configured" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

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

    return NextResponse.json(
      {
        success: true,
        contractAddress,
        network: "Base Mainnet (8453)",
        blockNumber,
        gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
        basescanLink: `https://basescan.org/address/${contractAddress}`,
      },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
