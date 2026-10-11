import type { ReactNode } from "react";

type IconName =
  | "dashboard"
  | "orders"
  | "inventory"
  | "designers"
  | "sync"
  | "reviews"
  | "settings"
  | "menu"
  | "close"
  | "info";

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  orders: (
    <>
      <path d="M6 2h12l1 4H5L6 2z" />
      <path d="M5 6h14v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6z" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
  inventory: (
    <>
      <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
      <path d="M3 7l2-4h14l2 4" />
      <path d="M10 11h4" />
    </>
  ),
  designers: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </>
  ),
  sync: (
    <>
      <path d="M4 12a8 8 0 0 1 13.5-5.5L20 4v6h-6" />
      <path d="M20 12a8 8 0 0 1-13.5 5.5L4 20v-6h6" />
    </>
  ),
  reviews: (
    <>
      <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5.1L12 14.8 7.5 16.8l.9-5.1L4.8 8.2l5-.7L12 3z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </>
  ),
};

export function Icon({
  name,
  className,
  size = 18,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={size >= 26 ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
