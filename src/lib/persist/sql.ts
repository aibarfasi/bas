import "server-only";

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;

let tableReady = false;

async function client(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const mod = await import("@neondatabase/serverless");
    return mod.neon(url) as unknown as Sql;
  } catch {
    return null;
  }
}

export async function loadSqlJson<T>(key: string): Promise<T | null> {
  const sql = await client();
  if (!sql) return null;
  try {
    await ensureTable(sql);
    const rows = (await sql`SELECT v FROM bas_kv WHERE k = ${key} LIMIT 1`) as { v: string }[];
    const raw = rows?.[0]?.v;
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
  } catch {
    return null;
  }
}

export async function saveSqlJson(key: string, value: unknown) {
  const sql = await client();
  if (!sql) return;
  try {
    await ensureTable(sql);
    const payload = JSON.stringify(value);
    await sql`
      INSERT INTO bas_kv (k, v) VALUES (${key}, ${payload})
      ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now()
    `;
  } catch {
    // Optional — file/memory still hold the row.
  }
}

async function ensureTable(sql: Sql) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS bas_kv (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  tableReady = true;
}
