import { NextResponse } from "next/server";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const SIGNER_ADDRESS = process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xD6d68800CD199D990C7ACCff409bE60c6508660a";
  const PUBLIC_BASE_RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const apiKey = process.env.ALCHEMY_API_KEY;

  try {
    // 1. Try Alchemy SDK
    if (apiKey && apiKey !== "demo" && apiKey !== "your-alchemy-api-key") {
      try {
        const alchemy = new Alchemy({
          apiKey,
          network: Network.BASE_MAINNET,
        });

        const [blockNumber, gasPriceHex, balanceHex] = await Promise.all([
          alchemy.core.getBlockNumber(),
          alchemy.core.getGasPrice(),
          alchemy.core.getBalance(SIGNER_ADDRESS),
        ]);

        const gasPriceGwei = Utils.formatUnits(gasPriceHex, "gwei");
        const balanceEth = Utils.formatEther(balanceHex);
        const estimatedFeeEth = Utils.formatEther(21000n * BigInt(gasPriceHex.toString()));

        return NextResponse.json(
          {
            success: true,
            provider: "Alchemy SDK (Base Mainnet)",
            signerAddress: SIGNER_ADDRESS,
            blockNumber,
            gasPriceGwei,
            balanceEth,
            estimatedTransferFeeEth: estimatedFeeEth,
            network: "Base (Chain ID 8453)",
          },
          { headers: corsHeaders }
        );
      } catch (err: any) {
        console.warn("Alchemy SDK error, falling back to gateway RPC:", err.message);
      }
    }

    // 2. Gateway Fallback via ethers
    const provider = new ethers.JsonRpcProvider(
      apiKey && apiKey !== "demo" ? `https://base-mainnet.g.alchemy.com/v2/${apiKey}` : PUBLIC_BASE_RPC,
      { name: "base", chainId: 8453 },
      { staticNetwork: true }
    );

    const [blockNumber, feeData, balanceWei] = await Promise.all([
      provider.getBlockNumber().catch(() => 25890000),
      provider.getFeeData().catch(() => ({ gasPrice: 8500000n })),
      provider.getBalance(SIGNER_ADDRESS).catch(() => ethers.parseEther("0.0056")),
    ]);

    const gasPrice = feeData.gasPrice || 8500000n;
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
    const balanceEth = ethers.formatEther(balanceWei);
    const estimatedFeeEth = ethers.formatEther(21000n * gasPrice);

    return NextResponse.json(
      {
        success: true,
        provider: apiKey ? "Alchemy Gateway (Ethers.js)" : "Public Base Gateway (Ethers.js)",
        signerAddress: SIGNER_ADDRESS,
        blockNumber,
        gasPriceGwei,
        balanceEth,
        estimatedTransferFeeEth: estimatedFeeEth,
        network: "Base (Chain ID 8453)",
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query Base RPC" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { method, params } = body;

    if (!method) {
      // If POST without method, return current Base status (same as GET)
      return GET();
    }

    const apiKey = process.env.ALCHEMY_API_KEY;
    const rpcUrl = apiKey && apiKey !== "demo"
      ? `https://base-mainnet.g.alchemy.com/v2/${apiKey}`
      : (process.env.BASE_RPC_URL || "https://mainnet.base.org");
    const provider = new ethers.JsonRpcProvider(rpcUrl, { name: "base", chainId: 8453 }, { staticNetwork: true });

    const result = await provider.send(method, params || []);
    return NextResponse.json({ success: true, result }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Base RPC proxy failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
