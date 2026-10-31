"use server";

import { redirect } from "next/navigation";
import type { DocumentKind } from "@/lib/invoice";
import {
  createManualInvoice,
  deleteManualInvoice,
  validateInvoice,
  type ManualInvoiceInput,
} from "@/lib/manual-invoices";
import { limitFor } from "@/lib/ratelimit";

export type FormState = { error: string | null };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const lines = (value: string) => value.split("\n").map((l) => l.trim()).filter(Boolean);
const number = (value: unknown) => (value === "" || value === null || value === undefined ? 0 : Number(value));

export async function createInvoiceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const limited = await limitFor("save");
  if (limited) return { error: limited };
  let rawLines: { service?: unknown; description?: unknown; quantity?: unknown; rate?: unknown }[];
  try {
    rawLines = JSON.parse(text(form, "lines") || "[]");
    if (!Array.isArray(rawLines)) throw new Error();
  } catch {
    return { error: "The lines could not be read. Please try again." };
  }
  const billTo = lines(text(form, "billTo"));
  const input: ManualInvoiceInput = {
    kind: text(form, "kind") as DocumentKind,
    date: text(form, "date"),
    billTo,
    shipTo: form.get("sameAddress") ? billTo : lines(text(form, "shipTo")),
    currency: text(form, "currency"),
    lines: rawLines
      .map((l) => ({
        service: String(l.service ?? "").trim(),
        description: String(l.description ?? "").trim(),
        quantity: number(l.quantity),
        rate: number(l.rate),
      }))
      .filter((l) => l.service || l.description || l.rate),
    discountPercent: number(text(form, "discountPercent")),
    shipping: number(text(form, "shipping")),
    notes: text(form, "notes"),
  };
  const error = validateInvoice(input);
  if (error) return { error };
  let id: number;
  try {
    id = await createManualInvoice(input);
  } catch {
    return { error: "The invoice could not be saved. Check that the database is connected (Settings)." };
  }
  redirect(`/invoices/manual/${id}`);
}

export async function deleteInvoiceAction(form: FormData) {
  if (await limitFor("save")) redirect("/invoices");
  const id = Number(form.get("id"));
  if (Number.isInteger(id) && id > 0) await deleteManualInvoice(id);
  redirect("/invoices");
}
