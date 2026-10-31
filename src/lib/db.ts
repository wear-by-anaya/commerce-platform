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
  // Profit tracker. Amounts are in the shop currency (PKR) unless a currency column says otherwise.
  await sql`CREATE TABLE IF NOT EXISTS brand_discounts (
    brand text PRIMARY KEY,
    percent numeric NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS product_costs (
    sku text PRIMARY KEY,
    cost numeric NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS order_costs (
    order_id text PRIMARY KEY,
    shipping_cost numeric NOT NULL DEFAULT 0,
    other_cost numeric NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS running_costs (
    id serial PRIMARY KEY,
    name text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL,
    every text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  // 31 Oct: expenses ledger (category, date paid, note) and per-product shipping.
  await sql`ALTER TABLE running_costs ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other'`;
  await sql`ALTER TABLE running_costs ADD COLUMN IF NOT EXISTS paid_on date`;
  await sql`ALTER TABLE running_costs ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE product_costs ADD COLUMN IF NOT EXISTS shipping numeric`;
  await sql`ALTER TABLE product_costs ALTER COLUMN cost DROP NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS rate_limits (
    bucket text NOT NULL,
    window_start timestamptz NOT NULL,
    hits integer NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket, window_start)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS update_reviews (
    item_key text PRIMARY KEY,
    reviewed_by text NOT NULL,
    reviewed_at timestamptz NOT NULL DEFAULT now(),
    note text NOT NULL DEFAULT ''
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
