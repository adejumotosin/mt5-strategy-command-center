import { timingSafeEqual } from "node:crypto";

export function verifyBridgeToken(request: Request) {
  const expected = process.env.MT5_BRIDGE_TOKEN;
  if (!expected) {
    return { ok: false as const, status: 503, error: "MT5 bridge is not configured." };
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { ok: false as const, status: 401, error: "Invalid bridge token." };
  }

  return { ok: true as const };
}

export async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }
  return request.json() as Promise<unknown>;
}
