import { Badge } from "@/components/ui/Badge";
import { updateKey, type UpdateItem, type UpdateReview as Review } from "@/lib/updates";
import { UpdateReview } from "./UpdateReview";
import styles from "./UpdatesList.module.css";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" });

/** Update rows; with `reviews`, each row gets the Reviewed tick and the note on what we changed. */
export function UpdatesList({ items, reviews }: { items: UpdateItem[]; reviews?: Map<string, Review> }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const key = updateKey(item);
        const review = reviews?.get(key);
        return (
          <li key={key} className={`${styles.item} ${review ? styles.done : ""}`}>
            <span className={styles.date}>{day(item.date)}</span>
            <span className={styles.body}>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              ) : (
                <span className={styles.titleText}>{item.title}</span>
              )}
              <span className={styles.source}>{item.source}</span>
              {review?.note ? <span className={styles.changed}>Changed: {review.note}</span> : null}
              {reviews ? <UpdateReview itemKey={key} title={item.title} review={review} /> : null}
            </span>
            {item.isNew && !review ? <Badge tone="accent">new</Badge> : <span />}
          </li>
        );
      })}
    </ul>
  );
}
