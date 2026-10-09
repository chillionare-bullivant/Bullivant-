import { NextResponse } from "next/server";
import { GET as getBaseRpc, OPTIONS as optionsBaseRpc } from "../../base-rpc/route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsBaseRpc();
}

export async function GET() {
  return getBaseRpc();
}
