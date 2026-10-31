import type { Metadata } from "next";
import Link from "next/link";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "@/components/PrintButton";
import buttons from "@/components/ui/Button.module.css";
import type { InvoiceData } from "@/lib/invoice";
import styles from "../toolbar.module.css";

export const metadata: Metadata = { title: "Sample invoice" };

const SAMPLE: InvoiceData = {
  kind: "Invoice",
  number: "SAMPLE-1001",
  date: "31/10/2026",
  billTo: ["Sample Customer", "1 Sample Street", "Sample City"],
  shipTo: ["Sample Customer", "1 Sample Street", "Sample City"],
  lines: [
    { date: "31/10/2026", service: "Sample outfit", description: "Sample brand, stitched, size M", quantity: 2, rate: 25000 },
    { date: "31/10/2026", service: "Sample fabric", description: "Sample brand, unstitched", quantity: 1, rate: 12000 },
  ],
  discountPercent: 5,
  currency: "PKR",
};

export default function Page() {
  return (
    <>
      <div className={styles.toolbar} data-print-hide>
        <Link href="/invoices" className={buttons.secondary}>Back</Link>
        <span className={styles.spacer} />
        <PrintButton />
      </div>
      <InvoiceDocument invoice={SAMPLE} />
    </>
  );
}
