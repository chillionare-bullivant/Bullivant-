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
      jsonrpc: "2.0",
      status: "Base RPC & Signer Endpoint Active",
      network: "Base Mainnet (8453)",
      supportedMethods: ["eth_blockNumber", "eth_getBalance", "eth_sendTo", "request_funds", "dispense"],
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, method, params } = body;

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const rpcUrl =
      alchemyKey && alchemyKey !== "demo"
        ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl, { name: "base", chainId: 8453 }, { staticNetwork: true });

    if (method === "eth_blockNumber") {
      const blockNumber = await provider.getBlockNumber();
      return NextResponse.json({ jsonrpc: "2.0", id, result: `0x${blockNumber.toString(16)}` }, { headers: corsHeaders });
    }

    if (method === "eth_getBalance" && Array.isArray(params) && params[0]) {
      const bal = await provider.getBalance(params[0]);
      return NextResponse.json({ jsonrpc: "2.0", id, result: `0x${bal.toString(16)}` }, { headers: corsHeaders });
    }

    if (method === "request_funds" || method === "dispense" || method === "eth_sendTo") {
      const to =
        typeof params === "object" && !Array.isArray(params)
          ? params.to
          : Array.isArray(params)
          ? params[0]
          : null;
      const amount =
        typeof params === "object" && !Array.isArray(params)
          ? params.amount || params.amountEth || "0.001"
          : Array.isArray(params) && params[1]
          ? params[1]
          : "0.001";

      if (!to || !ethers.isAddress(to)) {
        return NextResponse.json(
          { jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid destination address." } },
          { status: 400, headers: corsHeaders }
        );
      }

      const privateKey = process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
      const isConfigured = Boolean(
        privateKey && typeof privateKey === "string" && privateKey.startsWith("0x") && privateKey.length === 66
      );

      if (!isConfigured) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: "Server hot-wallet SIGNER_PRIVATE_KEY is not configured in environment variables.",
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const wallet = new ethers.Wallet(privateKey as string, provider);
      const valueToSend = ethers.parseEther(amount.toString());
      const tx = await wallet.sendTransaction({ to, value: valueToSend });

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            txHash: tx.hash,
            basescanUrl: `https://basescan.org/tx/${tx.hash}`,
            to,
            amount,
          },
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: {
          status: "base_rpc_gateway_active",
          network: "Base Mainnet (8453)",
          method,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message: error.message } },
      { status: 500, headers: corsHeaders }
    );
  }
}
