import { Badge } from "@/components/ui/Badge";
import type { UpdateItem } from "@/lib/updates";
import styles from "./UpdatesList.module.css";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" });

export function UpdatesList({ items }: { items: UpdateItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.source + item.link + item.title} className={styles.item}>
          <span className={styles.date}>{day(item.date)}</span>
          <span className={styles.body}>
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            ) : (
              item.title
            )}
            <span className={styles.source}>{item.source}</span>
          </span>
          {item.isNew ? <Badge tone="accent">new</Badge> : null}
        </li>
      ))}
    </ul>
  );
}
