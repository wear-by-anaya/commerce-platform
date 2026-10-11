import styles from "./PlaceholderPanel.module.css";

export function PlaceholderPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.badge}>NOT CONNECTED</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
    </section>
  );
}
