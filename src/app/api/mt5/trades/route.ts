import { readJsonBody, verifyBridgeToken } from "@/lib/bridge-auth";
import { parseTradeEnvelope } from "@/lib/bridge-validation";
import { saveTrade } from "@/lib/mt5-store";

export async function POST(request: Request) {
  const auth = verifyBridgeToken(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let envelope;
  try {
    envelope = parseTradeEnvelope(await readJsonBody(request));
    if (!envelope) return Response.json({ error: "Invalid trade transaction." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }

  try {
    const persisted = await saveTrade(envelope);
    return Response.json({ accepted: true, persisted, receivedAt: new Date().toISOString() }, { status: 202 });
  } catch (error) {
    console.error("MT5 trade ingestion failed.", error);
    return Response.json({ error: "Trade storage failed." }, { status: 503 });
  }
}
