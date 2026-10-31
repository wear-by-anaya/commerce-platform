import { headers } from "next/headers";
import { db, isDatabaseConnected } from "@/lib/db";

/**
 * Who uses the dashboard, from where and on what. A browser does not tell a website the device's own name,
 * so "device" is read from the browser's user agent ("Chrome on Windows", "Safari on iPhone").
 * Place comes from Vercel's IP location headers (city, region, country); it is approximate.
 */

export type Visitor = { device: string; deviceKey: string; ip: string; place: string; path: string };

export function describeDevice(ua: string) {
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? /Mobile/.test(ua)
          ? "Android phone"
          : "Android tablet"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux"
                : "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /OPR\//.test(ua)
        ? "Opera"
        : /Firefox|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome|CriOS/.test(ua)
            ? "Chrome"
            : /Safari/.test(ua)
              ? "Safari"
              : "browser";
  return `${browser} on ${os}`;
}

const decode = (value: string | null) => {
  try {
    return value ? decodeURIComponent(value) : "";
  } catch {
    return value ?? "";
  }
};

export async function visitor(): Promise<Visitor> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const place = [decode(h.get("x-vercel-ip-city")), h.get("x-vercel-ip-country-region"), h.get("x-vercel-ip-country")]
    .filter(Boolean)
    .join(", ");
  const device = describeDevice(ua);
  // Same browser on the same device = same key; a short hash keeps the table small.
  let hash = 0;
  for (const ch of ua) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  let path = "";
  try {
    path = new URL(h.get("referer") ?? "").pathname;
  } catch {}
  return { device, deviceKey: `${device}:${(hash >>> 0).toString(36)}`, ip, place, path };
}

// One "seen" write per person + device per minute per server instance; pages call requireUser many times.
const lastWrite = new Map<string, number>();

/** Updates "last seen" for this person's device. Never throws: auditing must not break a page. */
export function seenRecently(email: string, v: Visitor) {
  const key = `${email}|${v.deviceKey}`;
  const now = Date.now();
  if (now - (lastWrite.get(key) ?? 0) < 60_000) return true;
  lastWrite.set(key, now);
  return false;
}

export async function recordSeen(email: string, v: Visitor) {
  if (!isDatabaseConnected()) return;
  try {
    const sql = await db();
    await sql`INSERT INTO devices_seen (email, device_key, device, ip, place, last_path)
      VALUES (${email}, ${v.deviceKey}, ${v.device}, ${v.ip}, ${v.place}, ${v.path})
      ON CONFLICT (email, device_key) DO UPDATE SET last_seen = now(), ip = EXCLUDED.ip, place = EXCLUDED.place,
        last_path = CASE WHEN EXCLUDED.last_path = '' THEN devices_seen.last_path ELSE EXCLUDED.last_path END`;
  } catch {}
}

/** Adds one line to the history (sign-in, refused sign-in, a save). Never throws. */
export async function logEvent(email: string, event: string, detail = "") {
  if (!isDatabaseConnected()) return;
  try {
    const v = await visitor();
    const sql = await db();
    await sql`INSERT INTO audit_log (email, event, detail, device, ip, place)
      VALUES (${email}, ${event}, ${detail.slice(0, 300)}, ${v.device}, ${v.ip}, ${v.place})`;
    if (Math.random() < 0.01) await sql`DELETE FROM audit_log WHERE at < now() - interval '180 days'`;
  } catch {}
}

export type DeviceRow = {
  email: string;
  device: string;
  ip: string;
  place: string;
  firstSeen: string;
  lastSeen: string;
  lastPath: string;
  /** Seen in the last 5 minutes (decided by the database clock). */
  active: boolean;
};
export type EventRow = { at: string; email: string; event: string; detail: string; device: string; ip: string; place: string };

export const EVENTS_PER_PAGE = 30;

export async function activity(page = 1, q = "") {
  const sql = await db();
  // Searches person, event, detail, device and place; % and _ match literally.
  const like = `%${q.trim().slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const [devices, events, count] = await Promise.all([
    sql`SELECT email, device, ip, place, first_seen::text AS first_seen, last_seen::text AS last_seen, last_path,
        last_seen > now() - interval '5 minutes' AS active
      FROM devices_seen ORDER BY last_seen DESC LIMIT 100`,
    sql`SELECT at::text AS at, email, event, detail, device, ip, place FROM audit_log
      WHERE email ILIKE ${like} OR event ILIKE ${like} OR detail ILIKE ${like} OR device ILIKE ${like} OR place ILIKE ${like}
      ORDER BY at DESC LIMIT ${EVENTS_PER_PAGE} OFFSET ${(page - 1) * EVENTS_PER_PAGE}`,
    sql`SELECT count(*)::int AS n FROM audit_log
      WHERE email ILIKE ${like} OR event ILIKE ${like} OR detail ILIKE ${like} OR device ILIKE ${like} OR place ILIKE ${like}`,
  ]);
  return {
    devices: devices.map((r) => ({
      email: String(r.email),
      device: String(r.device),
      ip: String(r.ip),
      place: String(r.place),
      firstSeen: String(r.first_seen),
      lastSeen: String(r.last_seen),
      lastPath: String(r.last_path),
      active: Boolean(r.active),
    })) as DeviceRow[],
    events: events.map((r) => ({
      at: String(r.at),
      email: String(r.email),
      event: String(r.event),
      detail: String(r.detail),
      device: String(r.device),
      ip: String(r.ip),
      place: String(r.place),
    })) as EventRow[],
    total: Number(count[0]?.n ?? 0),
  };
}
