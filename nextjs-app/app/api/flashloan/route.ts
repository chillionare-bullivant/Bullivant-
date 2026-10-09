import { NextResponse } from "next/server";
import { GET as getStatus } from "./status/route";
import { POST as executePost } from "./execute/route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return getStatus();
}

export async function POST(req: Request) {
  return executePost(req);
}
