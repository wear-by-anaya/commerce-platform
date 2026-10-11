import Link from "next/link";
import { STORE_BRAND } from "@/lib/config";
import styles from "./AppShell.module.css";

const NAV = [
  {
    "href": "/",
    "label": "Dashboard"
  },
  {
    "href": "/orders",
    "label": "Orders"
  },
  {
    "href": "/inventory",
    "label": "Inventory"
  },
  {
    "href": "/designers",
    "label": "Designers"
  },
  {
    "href": "/sync-runs",
    "label": "Sync Runs"
  },
  {
    "href": "/reviews",
    "label": "Reviews"
  },
  {
    "href": "/settings",
    "label": "Settings"
  }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <p className={styles.brandName}>{STORE_BRAND}</p>
          <p className={styles.brandSub}>Operations Platform</p>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
