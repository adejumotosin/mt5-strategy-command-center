import { readJsonBody, verifyBridgeToken } from "@/lib/bridge-auth";
import { parseHeartbeat } from "@/lib/bridge-validation";
import { saveHeartbeat } from "@/lib/mt5-store";

export async function POST(request: Request) {
  const auth = verifyBridgeToken(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let heartbeat;
  try {
    heartbeat = parseHeartbeat(await readJsonBody(request));
    if (!heartbeat) return Response.json({ error: "Invalid heartbeat payload." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }

  try {
    const persisted = await saveHeartbeat(heartbeat);
    return Response.json({
      accepted: true,
      persisted,
      server: heartbeat.server,
      symbols: heartbeat.symbols.map((symbol) => symbol.name),
      receivedAt: new Date().toISOString(),
    }, { status: 202 });
  } catch (error) {
    console.error("MT5 heartbeat ingestion failed.", error);
    return Response.json({ error: "Heartbeat storage failed." }, { status: 503 });
  }
}
