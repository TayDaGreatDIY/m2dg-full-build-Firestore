
import { missionsFlow } from "@/ai/flows/missions-flow";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await missionsFlow(body);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("API error in missions-flow:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
