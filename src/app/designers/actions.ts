"use server";

import { revalidatePath } from "next/cache";
import { BRANDS } from "@/lib/brands";
import { oldestBrands, scanBrand, setPartner } from "@/lib/designers";
import { limitFor } from "@/lib/ratelimit";

export async function togglePartnerAction(form: FormData) {
  if (await limitFor("save")) return;
  await setPartner(String(form.get("slug") ?? ""), form.get("partner") === "on");
  revalidatePath("/designers");
}

export async function checkBrandAction(form: FormData) {
  if (await limitFor("save")) return;
  const brand = BRANDS.find((b) => b.slug === form.get("slug"));
  if (brand) await scanBrand(brand);
  revalidatePath("/designers");
  revalidatePath("/inventory");
}

/** Checks the 5 brands checked longest ago, one after another, within about 4 minutes. */
export async function checkOldestAction() {
  if (await limitFor("save")) return;
  const started = Date.now();
  for (const brand of await oldestBrands(5)) {
    if (Date.now() - started > 200_000) break;
    await scanBrand(brand);
  }
  revalidatePath("/designers");
  revalidatePath("/inventory");
}
