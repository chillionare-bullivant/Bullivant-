import { NextResponse } from "next/server";
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
  return NextResponse.json(
    {
      success: true,
      service: "Base Gas Dispenser",
      network: "Base Mainnet (8453)",
      method: "POST",
      instructions: "Send POST with { destinationAddress, amountEth } to dispense funds.",
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { destinationAddress, targetAddress, amountEth = "0.001" } = body;
    const dest = destinationAddress || targetAddress;

    if (!dest || !ethers.isAddress(dest)) {
      return NextResponse.json(
        { success: false, error: "Invalid EVM destination address." },
        { status: 400, headers: corsHeaders }
      );
    }

    const privateKey = process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const isConfigured = Boolean(
      privateKey && typeof privateKey === "string" && privateKey.startsWith("0x") && privateKey.length === 66
    );

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const rpcUrl =
      alchemyKey && alchemyKey !== "demo"
        ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl, { name: "base", chainId: 8453 }, { staticNetwork: true });

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: true,
          simulation: true,
          isLiveBroadcast: false,
          message: "Simulation mode: Configured for Base Mainnet. To broadcast live, add SIGNER_PRIVATE_KEY in project environment variables.",
          destinationAddress: dest,
          requestedAmountEth: amountEth,
          network: "Base Mainnet (Chain ID 8453)",
        },
        { headers: corsHeaders }
      );
    }

    const wallet = new ethers.Wallet(privateKey as string, provider);
    const balance = await provider.getBalance(wallet.address);
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n;
    const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 20000000n;
    const gasCost = gasLimit * maxFeePerGas;

    const valueToSend = ethers.parseEther(amountEth.toString());
    if (balance < valueToSend + gasCost) {
      return NextResponse.json(
        {
          success: false,
          isLiveBroadcast: false,
          error: `Insufficient balance in server hot-wallet (${wallet.address}). Balance: ${ethers.formatEther(balance)} ETH, needed: ${ethers.formatEther(valueToSend + gasCost)} ETH.`,
          serverAddress: wallet.address,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const tx = await wallet.sendTransaction({
      to: dest,
      value: valueToSend,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });

    return NextResponse.json(
      {
        success: true,
        isLiveBroadcast: true,
        txHash: tx.hash,
        basescanUrl: `https://basescan.org/tx/${tx.hash}`,
        from: wallet.address,
        to: dest,
        amountTransferredEth: amountEth,
        network: "Base Mainnet (Chain ID 8453)",
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispense funds via RPC" },
      { status: 500, headers: corsHeaders }
    );
  }
}
