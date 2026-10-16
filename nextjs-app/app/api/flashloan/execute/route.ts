import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const FLASHLOAN_CONTRACT_ADDRESS =
  process.env.BASE_FLASHLOAN_CONTRACT_ADDRESS ||
  process.env.ARBITRAGE_CONTRACT_ADDRESS ||
  "0x6B2d3688126e855524316Df9e2E2F80f83F5781A";

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const FLASHLOAN_ABI = [
  "function requestFlashLoanUSDC(uint256 amount) external",
  "function requestFlashLoanWETH(uint256 amount) external",
  "function withdraw(address token) external",
  "function getBalance(address token) view returns (uint256)",
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { asset, amount, signerPrivateKey } = body;

    if (!asset || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing asset or amount" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const contractAddress =
      FLASHLOAN_CONTRACT_ADDRESS && ethers.isAddress(FLASHLOAN_CONTRACT_ADDRESS)
        ? FLASHLOAN_CONTRACT_ADDRESS
        : "0x6B2d3688126e855524316Df9e2E2F80f83F5781A";

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return NextResponse.json(
        { success: false, error: "Flash loan contract not configured" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const activePrivateKey =
      signerPrivateKey ||
      req.headers.get("x-signer-key") ||
      SIGNER_PRIVATE_KEY;

    const isPrivateKeyValid =
      typeof activePrivateKey === "string" &&
      activePrivateKey.length === 66 &&
      activePrivateKey.startsWith("0x") &&
      activePrivateKey !== "0xYOUR_PRIVATE_KEY_HERE";

    if (!isPrivateKeyValid) {
      return NextResponse.json(
        {
          success: false,
          simulation: true,
          message: "Simulation mode: Flash loan setup verified. Configure SIGNER_PRIVATE_KEY on Vercel or open in Coinbase Wallet to execute live.",
          contractAddress,
          asset,
          amount,
        },
        {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Live execution
    const provider = new ethers.JsonRpcProvider(
      BASE_RPC_URL,
      { name: "base", chainId: 8453 },
      { staticNetwork: true }
    );
    const signer = new ethers.Wallet(activePrivateKey, provider);
    const contract = new ethers.Contract(
      contractAddress,
      FLASHLOAN_ABI,
      signer
    );

    let tx;
    if (asset.toUpperCase() === "USDC") {
      const parsedAmount = ethers.parseUnits(amount.toString(), 6); // USDC: 6 decimals
      tx = await contract.requestFlashLoanUSDC(parsedAmount);
    } else if (asset.toUpperCase() === "WETH") {
      const parsedAmount = ethers.parseUnits(amount.toString(), 18); // WETH: 18 decimals
      tx = await contract.requestFlashLoanWETH(parsedAmount);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported asset. Choose USDC or WETH." },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        txHash: tx.hash,
        basescanUrl: `https://basescan.org/tx/${tx.hash}`,
        contractAddress,
        asset,
        amount,
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
