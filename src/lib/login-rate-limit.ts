import "server-only";

import { neonQuery } from "@/lib/neon-http";

const WINDOW_MS = 15 * 60 * 1_000;
let authSchemaReady: Promise<void> | null = null;

async function ensureAuthSchema() {
  if (!authSchemaReady) {
    authSchemaReady = neonQuery(`
      CREATE TABLE IF NOT EXISTS sentry_login_attempts (
        fingerprint text PRIMARY KEY,
        failures integer NOT NULL DEFAULT 0,
        window_started timestamptz NOT NULL DEFAULT now(),
        blocked_until timestamptz
      )
    `).then(() => undefined).catch((error) => {
      authSchemaReady = null;
      throw error;
    });
  }
  return authSchemaReady;
}

export async function checkLoginAllowed(fingerprint: string) {
  await ensureAuthSchema();
  const rows = await neonQuery(`
    SELECT failures::text, window_started::text, blocked_until::text
    FROM sentry_login_attempts
    WHERE fingerprint = $1
  `, [fingerprint]);
  const row = rows[0];
  if (!row) return { allowed: true, retryAfter: 0 };

  const blockedUntil = row.blocked_until ? new Date(row.blocked_until).getTime() : 0;
  if (blockedUntil > Date.now()) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1_000)) };
  }

  const windowStarted = row.window_started ? new Date(row.window_started).getTime() : 0;
  if (windowStarted && Date.now() - windowStarted > WINDOW_MS) {
    await neonQuery("DELETE FROM sentry_login_attempts WHERE fingerprint = $1", [fingerprint]);
  }
  return { allowed: true, retryAfter: 0 };
}

export async function recordFailedLogin(fingerprint: string) {
  await ensureAuthSchema();
  await neonQuery(`
    INSERT INTO sentry_login_attempts (fingerprint, failures, window_started, blocked_until)
    VALUES ($1, 1, now(), null)
    ON CONFLICT (fingerprint) DO UPDATE SET
      failures = CASE
        WHEN sentry_login_attempts.window_started < now() - interval '15 minutes' THEN 1
        ELSE sentry_login_attempts.failures + 1
      END,
      window_started = CASE
        WHEN sentry_login_attempts.window_started < now() - interval '15 minutes' THEN now()
        ELSE sentry_login_attempts.window_started
      END,
      blocked_until = CASE
        WHEN sentry_login_attempts.window_started < now() - interval '15 minutes' THEN null
        WHEN sentry_login_attempts.failures + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE sentry_login_attempts.blocked_until
      END
  `, [fingerprint]);
}

export async function clearLoginFailures(fingerprint: string) {
  await ensureAuthSchema();
  await neonQuery("DELETE FROM sentry_login_attempts WHERE fingerprint = $1", [fingerprint]);
}
