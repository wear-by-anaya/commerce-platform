import Link from "next/link";
import { Icon } from "@/components/icons";
import styles from "./Pagination.module.css";

/** Previous / next pages with a short status ("Page 2 of 5" or "Orders 26–50"). A missing href greys the button out. */
export function Pagination({ prevHref, nextHref, label }: { prevHref?: string | null; nextHref?: string | null; label: string }) {
  if (!prevHref && !nextHref) return null;
  return (
    <nav className={styles.bar} aria-label="Pages">
      {prevHref ? (
        <Link href={prevHref} className={styles.step} scroll={false}>
          <Icon name="chevronLeft" size={16} />
          <span>Previous</span>
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.off}`} aria-disabled="true">
          <Icon name="chevronLeft" size={16} />
          <span>Previous</span>
        </span>
      )}
      <span className={styles.label} aria-live="polite">
        {label}
      </span>
      {nextHref ? (
        <Link href={nextHref} className={styles.step} scroll={false}>
          <span>Next</span>
          <Icon name="chevronRight" size={16} />
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.off}`} aria-disabled="true">
          <span>Next</span>
          <Icon name="chevronRight" size={16} />
        </span>
      )}
    </nav>
  );
}

/** Page number from a search param: 1 or more. */
export function pageFrom(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Builds "?a=1&b=2" from the current params with some keys changed (null removes a key). */
export function withParams(path: string, current: Record<string, string | string[] | undefined>, changes: Record<string, string | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (typeof value === "string") params.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
