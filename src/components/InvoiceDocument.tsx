import Image from "next/image";
import {
  INVOICE_LOGO,
  SELLER,
  formatAmount,
  formatTotal,
  invoiceTotals,
  lineAmount,
  type InvoiceData,
} from "@/lib/invoice";
import styles from "./InvoiceDocument.module.css";

function Address({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className={styles.label}>{title}</p>
      {lines.map((line) => (
        <p key={line} className={styles.line}>
          {line}
        </p>
      ))}
    </div>
  );
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const { subtotal, discount, shipping, total } = invoiceTotals(invoice);
  return (
    <article className={styles.page}>
      <header className={styles.seller}>
        <div>
        <h1 className={styles.brand}>{SELLER.name}</h1>
        <p className={styles.line}>{SELLER.line1}</p>
        <p className={styles.line}>{SELLER.line2}</p>
        <p className={styles.line}>{SELLER.phone}</p>
        <p className={styles.line}>{SELLER.email}</p>
        <p className={styles.line}>{SELLER.website}</p>
        </div>
        <Image
          className={styles.logo}
          src={INVOICE_LOGO.src}
          alt={SELLER.name + " logo"}
          width={INVOICE_LOGO.width}
          height={INVOICE_LOGO.height}
          style={{ height: INVOICE_LOGO.cssH, width: "auto" }}
          unoptimized
          priority
        />
      </header>

      <h2 className={styles.kind}>{invoice.kind}</h2>

      <section className={styles.parties}>
        <Address title="ADDRESS" lines={invoice.billTo} />
        <Address title="SHIP TO" lines={invoice.shipTo} />
        <dl className={styles.meta}>
          <dt>{invoice.kind.toUpperCase()}</dt>
          <dd>{invoice.number}</dd>
          <dt>DATE</dt>
          <dd>{invoice.date}</dd>
        </dl>
      </section>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>DATE</th>
              <th>SERVICE</th>
              <th>DESCRIPTION</th>
              <th className={styles.num}>QTY</th>
              <th className={styles.num}>RATE</th>
              <th className={styles.num}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i}>
                <td>{line.date}</td>
                <td>{line.service}</td>
                <td>{line.description}</td>
                <td className={styles.num}>{line.quantity}</td>
                <td className={styles.num}>{formatAmount(line.rate)}</td>
                <td className={styles.num}>{formatAmount(lineAmount(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className={styles.totals}>
        <dt>SUBTOTAL</dt>
        <dd>{formatAmount(subtotal)}</dd>
        {discount > 0 ? (
          <>
            <dt>DISCOUNT{invoice.discountAmount === undefined ? ` ${invoice.discountPercent}%` : ""}</dt>
            <dd>-{formatAmount(discount)}</dd>
          </>
        ) : null}
        {shipping > 0 ? (
          <>
            <dt>SHIPPING</dt>
            <dd>{formatAmount(shipping)}</dd>
          </>
        ) : null}
        <dt className={styles.grand}>TOTAL</dt>
        <dd className={styles.grand}>{formatTotal(total, invoice.currency)}</dd>
      </dl>

      {invoice.kind === "Estimate" ? (
        <section className={styles.accept}>
          <p>Accepted By</p>
          <p>Accepted Date</p>
        </section>
      ) : null}

      <footer className={styles.legal}>{SELLER.legal}</footer>
    </article>
  );
}
