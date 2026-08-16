import { readJsonBody, verifyBridgeToken } from "@/lib/bridge-auth";
import { isTradeEnvelope } from "@/lib/bridge-validation";

export async function POST(request: Request) {
  const auth = verifyBridgeToken(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const payload = await readJsonBody(request);
    if (!isTradeEnvelope(payload)) return Response.json({ error: "Invalid trade transaction." }, { status: 400 });
    return Response.json({ accepted: true, receivedAt: new Date().toISOString() }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
