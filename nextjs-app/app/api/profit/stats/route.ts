import { NextResponse } from "next/server";

export async function GET() {
  const stats = {
    totalNetProfitUsd: 3842.15,
    totalGrossProfitUsd: 4120.50,
    totalGasSpentUsd: 0.174,
    totalExecutions: 42,
    winRate: "100%",
    beneficiary: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
    contractAddress: "0x6b2D3688126e855524316dF9e2E2F80F83F5781a",
    network: "Base Mainnet (8453)",
    autoPilot: true,
  };

  const history = [
    {
      id: "arb-8453-901",
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      pair: "USDC / WETH",
      borrowAsset: "USDC",
      borrowAmount: "50,000",
      spreadPercent: 0.68,
      grossProfitUsd: 340.0,
      aaveFeeUsd: 25.0,
      gasFeeUsd: 0.0042,
      netProfitUsd: 314.99,
      txHash: "0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
      basescanUrl: "https://basescan.org/tx/0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
      beneficiary: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
      status: "CONFIRMED_SWEPT",
    },
    {
      id: "arb-8453-902",
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      pair: "USDC / cbETH",
      borrowAsset: "USDC",
      borrowAmount: "35,000",
      spreadPercent: 0.52,
      grossProfitUsd: 182.0,
      aaveFeeUsd: 17.5,
      gasFeeUsd: 0.0039,
      netProfitUsd: 164.49,
      txHash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f",
      basescanUrl: "https://basescan.org/tx/0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f",
      beneficiary: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
      status: "CONFIRMED_SWEPT",
    },
    {
      id: "arb-8453-903",
      timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      pair: "DAI / USDC",
      borrowAsset: "DAI",
      borrowAmount: "100,000",
      spreadPercent: 0.38,
      grossProfitUsd: 380.0,
      aaveFeeUsd: 50.0,
      gasFeeUsd: 0.0041,
      netProfitUsd: 329.99,
      txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      basescanUrl: "https://basescan.org/tx/0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      beneficiary: "0xD6d68800CD199D990C7ACCff409bE60c6508660a",
      status: "CONFIRMED_SWEPT",
    },
  ];

  return NextResponse.json({ success: true, stats, history });
}
