import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon Postgres for this store only. DATABASE_URL is set in Vercel (Storage > Neon), never in the repo.
 * Tables are created on first use, so a fresh database needs no manual setup.
 */
type Sql = NeonQueryFunction<false, false>;

let ready: Promise<Sql> | null = null;

export function isDatabaseConnected() {
  return Boolean(process.env.DATABASE_URL);
}

async function migrate(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS manual_invoices (
    id serial PRIMARY KEY,
    number text NOT NULL UNIQUE,
    kind text NOT NULL,
    invoice_date date NOT NULL,
    bill_to text NOT NULL,
    ship_to text NOT NULL,
    currency text NOT NULL,
    lines jsonb NOT NULL,
    discount_percent numeric NOT NULL DEFAULT 0,
    shipping numeric NOT NULL DEFAULT 0,
    notes text NOT NULL DEFAULT '',
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  return sql;
}

/** Callers check the user first (requireUser); this only opens the connection. */
export function db() {
  if (!ready) {
    ready = migrate(neon(process.env.DATABASE_URL ?? "")).catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}
