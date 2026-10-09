import { NextResponse } from "next/server";
import { POST as executeFlashloan, GET as getFlashloanInfo, OPTIONS as optionsFlashloan } from "../../base/flashloan/route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsFlashloan();
}

export async function GET() {
  return getFlashloanInfo();
}

export async function POST(req: Request) {
  return executeFlashloan(req);
}
