"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { STORE_BRAND } from "@/lib/config";
import { NAV_ITEMS } from "@/lib/nav";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className={`${styles.shell} ${open ? styles.navOpen : ""}`}>
      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <div className={styles.mobileBrand}>
          <p className={styles.brandName}>{STORE_BRAND}</p>
          <p className={styles.brandSub}>Operations</p>
        </div>
        <Tooltip content="Integrations are not connected yet">
          <span className={styles.statusChip}>NOT CONNECTED</span>
        </Tooltip>
      </header>

      {open ? (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside id={panelId} className={styles.sidebar} aria-label="Application">
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <p className={styles.brandName}>{STORE_BRAND}</p>
            <p className={styles.brandSub}>Operations Platform</p>
          </div>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.closeDesktopHidden}`}
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className={styles.navIcon}>
                  <Icon name={item.icon} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge ? (
                  <Tooltip content={item.badge.tooltip} side="right">
                    <span className={styles.navBadge}>
                      <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
                    </span>
                  </Tooltip>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Tooltip content="Shopify, database, and auth are not wired in this boilerplate">
            <div className={styles.connectionCard}>
              <span className={styles.connectionDot} aria-hidden="true" />
              <div>
                <p className={styles.connectionTitle}>System status</p>
                <p className={styles.connectionText}>NOT CONNECTED</p>
              </div>
            </div>
          </Tooltip>
        </div>
      </aside>

      <div className={styles.content}>
        <div className={styles.desktopTop}>
          <p className={styles.desktopEyebrow}>Internal operations</p>
          <Tooltip content="Live data appears after Shopify and workers are connected">
            <span className={styles.statusChip}>NOT CONNECTED</span>
          </Tooltip>
        </div>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
