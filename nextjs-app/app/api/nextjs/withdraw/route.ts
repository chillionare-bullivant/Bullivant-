import { NextResponse } from "next/server";
import { POST as postWithdraw, GET as getWithdraw, OPTIONS as optionsWithdraw } from "../../withdraw/route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsWithdraw();
}

export async function GET() {
  return getWithdraw();
}

export async function POST(req: Request) {
  return postWithdraw(req);
}
