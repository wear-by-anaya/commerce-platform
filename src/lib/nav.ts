export type NavBadge = {
  label: string;
  tone: "neutral" | "accent" | "warning";
  tooltip: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "orders" | "inventory" | "designers" | "sync" | "reviews" | "settings";
  badge?: NavBadge;
};

/** Placeholder badges — live counts arrive only after integrations are connected. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  {
    href: "/orders",
    label: "Orders",
    icon: "orders",
    badge: {
      label: "—",
      tone: "neutral",
      tooltip: "Orders feed not connected",
    },
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: "inventory",
    badge: {
      label: "—",
      tone: "neutral",
      tooltip: "Inventory sync not connected",
    },
  },
  { href: "/designers", label: "Designers", icon: "designers" },
  {
    href: "/sync-runs",
    label: "Sync Runs",
    icon: "sync",
    badge: {
      label: "—",
      tone: "warning",
      tooltip: "Stock sync worker not connected",
    },
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: "reviews",
    badge: {
      label: "—",
      tone: "accent",
      tooltip: "Review queue not connected",
    },
  },
  { href: "/settings", label: "Settings", icon: "settings" },
];
