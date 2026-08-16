import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const DASHBOARD_SESSION_COOKIE = "sentry_dashboard_session";
export const DASHBOARD_SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
};

function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD ?? "";
}

function getSessionSecret() {
  const bridgeToken = process.env.MT5_BRIDGE_TOKEN ?? "";
  const password = getDashboardPassword();
  return bridgeToken && password ? `${bridgeToken}:${password}` : "";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safelyEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isDashboardAuthConfigured() {
  return getDashboardPassword().length >= 8 && getSessionSecret().length > 0;
}

export function verifyDashboardPassword(candidate: string) {
  const expected = getDashboardPassword();
  return isDashboardAuthConfigured() && safelyEqual(candidate, expected);
}

export function createDashboardSessionToken(now = Date.now()) {
  if (!isDashboardAuthConfigured()) throw new Error("Dashboard authentication is not configured.");
  const payload: SessionPayload = {
    version: 1,
    issuedAt: now,
    expiresAt: now + DASHBOARD_SESSION_TTL_SECONDS * 1_000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyDashboardSessionToken(token: string | undefined, now = Date.now()) {
  if (!token || !isDashboardAuthConfigured()) return false;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra || !safelyEqual(signature, sign(encoded))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.version === 1 && payload.issuedAt <= now && payload.expiresAt > now;
  } catch {
    return false;
  }
}

export async function hasDashboardSession() {
  const session = (await cookies()).get(DASHBOARD_SESSION_COOKIE)?.value;
  return verifyDashboardSessionToken(session);
}

export function fingerprintLoginRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", getSessionSecret()).update(address).digest("hex");
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
