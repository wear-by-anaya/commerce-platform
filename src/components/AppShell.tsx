"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { BRAND_LOGO, BRAND_MARK } from "@/lib/brand-assets";
import { STORE_BRAND } from "@/lib/config";
import { NAV_GROUPS } from "@/lib/nav";
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
    <div className={`${styles.shell} ${open ? styles.open : ""}`}>
      <header className={styles.topMobile}>
        <div className={styles.mobileTitle}>
          {BRAND_MARK.show ? (
            <Image
              src={BRAND_MARK.src}
              alt=""
              width={BRAND_MARK.width}
              height={BRAND_MARK.height}
              className={styles.brandMark}
            />
          ) : null}
          <span>{STORE_BRAND}</span>
        </div>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </header>

      <aside
        id={panelId}
        className={styles.sidebar}
        aria-hidden={!open}
        aria-label="Navigation menu"
      >
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            {BRAND_LOGO.show ? (
              <Image
                src={BRAND_LOGO.src}
                alt={STORE_BRAND}
                width={BRAND_LOGO.width}
                height={BRAND_LOGO.height}
                className={styles.brandLogo}
                priority
              />
            ) : BRAND_MARK.show ? (
              <>
                <Image
                  src={BRAND_MARK.src}
                  alt=""
                  width={BRAND_MARK.width}
                  height={BRAND_MARK.height}
                  className={styles.brandMark}
                  priority
                />
                <div className={styles.brandText}>
                  <p className={styles.brandName}>{STORE_BRAND}</p>
                  <p className={styles.brandProduct}>Operations</p>
                </div>
              </>
            ) : (
              <div className={styles.brandText}>
                <p className={styles.brandName}>{STORE_BRAND}</p>
                <p className={styles.brandProduct}>Operations</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.menuClose}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        {BRAND_LOGO.show ? (
          <p className={styles.brandProductInline}>Operations</p>
        ) : null}

        <nav className={styles.nav} aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.group}>
              <p className={styles.groupLabel}>{group.label}</p>
              <ul className={styles.list}>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const showBadge =
                    typeof item.badgeCount === "number" && item.badgeCount > 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.link} ${active ? styles.active : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                        {showBadge ? (
                          <Badge tone={item.badgeTone ?? "neutral"}>
                            {item.badgeCount}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <span className={styles.dot} aria-hidden="true" />
          <span>Connections offline</span>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topDesktop}>
          <p className={styles.topHint}>Internal workspace</p>
          <p className={styles.topStatus}>Connections offline</p>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
