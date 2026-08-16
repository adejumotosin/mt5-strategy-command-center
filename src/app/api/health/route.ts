export function GET() {
  return Response.json({
    status: "ok",
    service: "sentry-tradeos",
    version: "0.1.0",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    time: new Date().toISOString(),
  });
}
