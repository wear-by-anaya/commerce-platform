"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { limitFor } from "@/lib/ratelimit";
import { requireUser } from "@/lib/session";

/** Marks an alert as done (or opens it again). Only alerts a person settles (new stock, failed jobs) use this. */
export async function markAlertAction(form: FormData) {
  const user = await requireUser();
  if (await limitFor("save")) return;
  const key = String(form.get("key") ?? "").trim().slice(0, 300);
  if (!/^(new-stock|run):/.test(key)) return;
  const sql = await db();
  if (form.get("done")) {
    await sql`INSERT INTO alert_reviews (alert_key, done_by) VALUES (${key}, ${user.email ?? ""})
      ON CONFLICT (alert_key) DO UPDATE SET done_by = EXCLUDED.done_by, done_at = now()`;
  } else {
    await sql`DELETE FROM alert_reviews WHERE alert_key = ${key}`;
  }
  revalidatePath("/reviews");
  revalidatePath("/");
}
