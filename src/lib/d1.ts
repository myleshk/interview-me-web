/**
 * Cloudflare D1 REST API client.
 *
 * Credentials come from server-side env vars (not NEXT_PUBLIC_):
 *   CF_ACCOUNT_ID      — Cloudflare account ID
 *   CF_D1_DATABASE_ID  — D1 database ID
 *   CF_API_TOKEN       — API token with D1 read/write
 */

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const DATABASE_ID = process.env.CF_D1_DATABASE_ID;
const API_TOKEN = process.env.CF_API_TOKEN;

const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    console.error("D1: missing CF_ACCOUNT_ID / CF_D1_DATABASE_ID / CF_API_TOKEN");
    return [];
  }

  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  const json = await res.json();

  if (!json.success || !json.result?.length) {
    console.error("D1 query failed");
    return [];
  }

  // D1 REST API returns row objects directly in result[0].results
  const rows = json.result[0].results;
  if (!Array.isArray(rows)) return []; // INSERT / UPDATE → null

  return rows as T[];
}
