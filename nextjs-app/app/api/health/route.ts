import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      framework: "Next.js 14 App Router",
      service: "Base Signer & Alchemy Gas Oracle Gateway",
      network: "Base Mainnet (Chain ID 8453)",
      timestamp: new Date().toISOString(),
      alchemyConfigured: Boolean(process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== "demo"),
      hotWalletConfigured: Boolean(process.env.SIGNER_PRIVATE_KEY),
      signerAddress: process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
      endpoints: [
        "/api/base-rpc",
        "/api/base/gas-history",
        "/api/withdraw",
        "/api/dispense",
        "/api/rpc",
        "/api/bag-home/one-click-deliver",
        "/api/nextjs/status",
        "/api/nextjs/withdraw",
        "/api/health",
      ],
    },
    { headers: corsHeaders }
  );
}
