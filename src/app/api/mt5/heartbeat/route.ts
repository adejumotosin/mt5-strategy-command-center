import { readJsonBody, verifyBridgeToken } from "@/lib/bridge-auth";
import { parseHeartbeat } from "@/lib/bridge-validation";

export async function POST(request: Request) {
  const auth = verifyBridgeToken(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const heartbeat = parseHeartbeat(await readJsonBody(request));
    if (!heartbeat) return Response.json({ error: "Invalid heartbeat payload." }, { status: 400 });

    return Response.json({
      accepted: true,
      server: heartbeat.server,
      symbols: heartbeat.symbols.map((symbol) => symbol.name),
      receivedAt: new Date().toISOString(),
    }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
