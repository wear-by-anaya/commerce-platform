"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/costs/actions";
import { limitFor } from "@/lib/ratelimit";
import { requireUser } from "@/lib/session";
import { isKind, isStatus } from "@/lib/run-kinds";
import { saveRun } from "@/lib/sync-runs";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const count = (value: string) => (value === "" ? 0 : Number(value.replace(/,/g, "")));

/** Adds a job that was run by hand (e.g. a bulk job started from the Shopify admin). */
export async function logRunAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const limited = await limitFor("save");
  if (limited) return { message: limited, error: true };
  const kind = text(form, "kind");
  const status = text(form, "status");
  const name = text(form, "name").slice(0, 160);
  const items = count(text(form, "items"));
  const errors = count(text(form, "errors"));
  const day = text(form, "day");
  if (!name) return { message: "Enter what the job was.", error: true };
  if (!isKind(kind)) return { message: "Choose the kind of job.", error: true };
  if (!isStatus(status)) return { message: "Choose how it went.", error: true };
  if (![items, errors].every((n) => Number.isInteger(n) && n >= 0)) return { message: "Counts must be whole numbers.", error: true };
  if (day && (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day)))) return { message: "Enter a valid date.", error: true };
  await saveRun({
    kind,
    name,
    status,
    items,
    errors,
    detail: text(form, "detail"),
    source: "manual",
    loggedBy: user.email ?? "",
    // A date without a time is saved as noon Pakistan time, so it shows on the right day.
    finishedAt: day ? `${day}T12:00:00+05:00` : null,
  });
  revalidatePath("/sync-runs");
  revalidatePath("/reviews");
  return { message: `Logged ${name}.`, error: false };
}
