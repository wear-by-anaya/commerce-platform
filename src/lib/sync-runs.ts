import { db } from "@/lib/db";
import { isKind, isStatus, type RunKind, type RunStatus } from "@/lib/run-kinds";
import { requireUser } from "@/lib/session";

/**
 * Sync runs: a log of the store jobs. Lines come from three places:
 * - the daily brand check (api/cron/brands) writes its own line,
 * - our job scripts send theirs to api/sync-runs (protected by SYNC_TOKEN),
 * - people add jobs done by hand with the form on the Sync runs page.
 */
export type NewRun = {
  kind: RunKind;
  name: string;
  status: RunStatus;
  items: number;
  errors: number;
  detail?: string;
  source: "cron" | "script" | "manual";
  loggedBy?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

/** Saves one run. Callers check who may write (signed-in person, cron secret or SYNC_TOKEN) before calling. */
export async function saveRun(run: NewRun) {
  const sql = await db();
  const rows = await sql`INSERT INTO sync_runs (kind, name, status, items, errors, detail, source, logged_by, started_at, finished_at)
    VALUES (${run.kind}, ${run.name.slice(0, 160)}, ${run.status}, ${Math.max(0, Math.round(run.items))}, ${Math.max(0, Math.round(run.errors))},
      ${(run.detail ?? "").slice(0, 2000)}, ${run.source}, ${(run.loggedBy ?? "").slice(0, 120)}, ${run.startedAt ?? null},
      COALESCE(${run.finishedAt ?? null}::timestamptz, now()))
    RETURNING id`;
  return Number(rows[0]?.id);
}

export type RunRow = {
  id: number;
  kind: string;
  name: string;
  status: RunStatus;
  items: number;
  errors: number;
  detail: string;
  source: string;
  loggedBy: string;
  startedAt: string | null;
  finishedAt: string;
};

export const RUNS_PER_PAGE = 30;

const toRow = (r: Record<string, unknown>): RunRow => ({
  id: Number(r.id),
  kind: String(r.kind),
  name: String(r.name),
  status: (isStatus(String(r.status)) ? String(r.status) : "ok") as RunStatus,
  items: Number(r.items),
  errors: Number(r.errors),
  detail: String(r.detail),
  source: String(r.source),
  loggedBy: String(r.logged_by),
  startedAt: r.started_at ? String(r.started_at) : null,
  finishedAt: String(r.finished_at),
});

/** One page of runs (newest first), with search over name + detail and an optional kind filter; plus the last run of each kind. */
export async function syncRuns(page = 1, q = "", kind = "") {
  await requireUser();
  const sql = await db();
  const like = `%${q.trim().slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const k = isKind(kind) ? kind : "";
  const [rows, count, latest] = await Promise.all([
    sql`SELECT id, kind, name, status, items, errors, detail, source, logged_by, started_at::text AS started_at, finished_at::text AS finished_at
      FROM sync_runs WHERE (name ILIKE ${like} OR detail ILIKE ${like}) AND (${k}::text = '' OR kind = ${k})
      ORDER BY finished_at DESC, id DESC LIMIT ${RUNS_PER_PAGE} OFFSET ${(page - 1) * RUNS_PER_PAGE}`,
    sql`SELECT count(*)::int AS n FROM sync_runs WHERE (name ILIKE ${like} OR detail ILIKE ${like}) AND (${k}::text = '' OR kind = ${k})`,
    sql`SELECT DISTINCT ON (kind) id, kind, name, status, items, errors, detail, source, logged_by, started_at::text AS started_at,
        finished_at::text AS finished_at
      FROM sync_runs ORDER BY kind, finished_at DESC, id DESC`,
  ]);
  return { runs: rows.map(toRow), total: Number(count[0]?.n ?? 0), latest: latest.map(toRow) };
}

/** Failed or partly failed runs of the last 30 days (for Reviews). */
export async function failedRuns() {
  const sql = await db();
  const rows = await sql`SELECT id, kind, name, status, items, errors, detail, source, logged_by, started_at::text AS started_at,
      finished_at::text AS finished_at
    FROM sync_runs WHERE status IN ('failed', 'partial') AND finished_at > now() - interval '30 days'
    ORDER BY finished_at DESC LIMIT 50`;
  return rows.map(toRow);
}
