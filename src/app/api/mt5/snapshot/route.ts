import { readJsonBody, verifyBridgeToken } from "@/lib/bridge-auth";
import { parseSnapshot } from "@/lib/bridge-validation";
import { saveSnapshot } from "@/lib/mt5-store";

export async function POST(request: Request) {
  const auth = verifyBridgeToken(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let snapshot;
  try {
    snapshot = parseSnapshot(await readJsonBody(request));
    if (!snapshot) return Response.json({ error: "Invalid market snapshot." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }

  try {
    const persisted = await saveSnapshot(snapshot);
    return Response.json({ accepted: true, persisted, receivedAt: new Date().toISOString() }, { status: 202 });
  } catch (error) {
    console.error("MT5 snapshot ingestion failed.", error);
    return Response.json({ error: "Snapshot storage failed." }, { status: 503 });
  }
}
