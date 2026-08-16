import { NextResponse } from "next/server";
import { DASHBOARD_SESSION_COOKIE, isSameOrigin } from "@/lib/dashboard-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: DASHBOARD_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
  return response;
}
