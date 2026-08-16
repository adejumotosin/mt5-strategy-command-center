export function GET() {
  return Response.json({
    status: "ok",
    service: "sentry-tradeos",
    version: "0.1.0",
    time: new Date().toISOString(),
  });
}
