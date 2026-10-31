"use client";

import { deleteInvoiceAction } from "@/app/invoices/actions";
import buttons from "./ui/Button.module.css";

export function DeleteInvoiceButton({ id, number }: { id: number; number: string }) {
  return (
    <form
      action={deleteInvoiceAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${number}? This can't be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={buttons.danger}>
        Delete
      </button>
    </form>
  );
}
