import { missionsFlow } from "@/ai/flows/missions-flow";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("missionsFlow request:", body);
    const res = await missionsFlow(body);
    return Response.json(res);
  } catch (err: any) {
    console.error("missionsFlow error:", err);
    return Response.json({ error: err.message || "Flow error" }, { status: 500 });
  }
}
