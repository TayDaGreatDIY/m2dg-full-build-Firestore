import { missionsFlow } from "@/ai/flows/missions-flow";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await missionsFlow(body);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("missions-flow route error:", err);
    return NextResponse.json({ error: err.message || "Flow error" }, { status: 500 });
  }
}
