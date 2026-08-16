import { NextResponse } from "next/server";
import {
  createDashboardSessionToken,
  DASHBOARD_SESSION_COOKIE,
  DASHBOARD_SESSION_TTL_SECONDS,
  fingerprintLoginRequest,
  isDashboardAuthConfigured,
  isSameOrigin,
  verifyDashboardPassword,
} from "@/lib/dashboard-auth";
import { checkLoginAllowed, clearLoginFailures, recordFailedLogin } from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!isDashboardAuthConfigured()) {
    return Response.json({ error: "Dashboard authentication is not configured." }, { status: 503 });
  }

  const fingerprint = fingerprintLoginRequest(request);
  try {
    const rateLimit = await checkLoginAllowed(fingerprint);
    if (!rateLimit.allowed) {
      return Response.json({ error: "Too many attempts. Try again later." }, {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 400 });
    }
    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (!verifyDashboardPassword(password)) {
      await recordFailedLogin(fingerprint);
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }

    await clearLoginFailures(fingerprint);
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set({
      name: DASHBOARD_SESSION_COOKIE,
      value: createDashboardSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: DASHBOARD_SESSION_TTL_SECONDS,
      priority: "high",
    });
    return response;
  } catch (error) {
    console.error("Dashboard login failed.", error);
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
