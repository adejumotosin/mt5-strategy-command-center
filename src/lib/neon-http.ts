type SqlParameter = string | number | boolean | null;

type NeonResult = {
  fields?: Array<{ name: string }>;
  rows?: Array<Array<string | null>>;
  message?: string;
};

function getConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const connection = new URL(connectionString);
  if (!connection.hostname.endsWith(".neon.tech")) {
    throw new Error("DATABASE_URL must point to a Neon Postgres database.");
  }

  const apiHost = connection.hostname.replace(/^[^.]+\./, "api.");
  return { connectionString, endpoint: `https://${apiHost}/sql` };
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function neonQuery(
  query: string,
  params: SqlParameter[] = [],
): Promise<Array<Record<string, string | null>>> {
  const { connectionString, endpoint } = getConnection();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": connectionString,
      "Neon-Raw-Text-Output": "true",
      "Neon-Array-Mode": "true",
    },
    body: JSON.stringify({
      query,
      params: params.map((value) => value === null ? null : String(value)),
    }),
    cache: "no-store",
  });

  const result = await response.json() as NeonResult;
  if (!response.ok) throw new Error(result.message ?? `Neon returned HTTP ${response.status}.`);

  const fields = result.fields ?? [];
  return (result.rows ?? []).map((row) => Object.fromEntries(
    row.map((value, index) => [fields[index]?.name ?? String(index), value]),
  ));
}
