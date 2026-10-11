import { Icon } from "@/components/icons";
import { Tooltip } from "@/components/ui/Tooltip";
import styles from "./PageHeader.module.css";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          <Tooltip content="This section is scaffolded and not connected to live data">
            <span className={styles.info} tabIndex={0} aria-label="Section info">
              <Icon name="info" />
            </span>
          </Tooltip>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
