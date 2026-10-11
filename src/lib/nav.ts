export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "orders" | "inventory" | "designers" | "sync" | "reviews" | "settings";
  /** Shown only when greater than zero. */
  badgeCount?: number;
  badgeTone?: "neutral" | "accent" | "warning";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/orders", label: "Orders", icon: "orders" },
  { href: "/inventory", label: "Inventory", icon: "inventory" },
  { href: "/designers", label: "Designers", icon: "designers" },
  { href: "/sync-runs", label: "Sync Runs", icon: "sync" },
  { href: "/reviews", label: "Reviews", icon: "reviews" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
