export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "orders" | "inventory" | "designers" | "sync" | "reviews" | "settings";
  badgeCount?: number;
  badgeTone?: "neutral" | "accent" | "warning";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/orders", label: "Orders", icon: "orders" },
      { href: "/inventory", label: "Inventory", icon: "inventory" },
      { href: "/designers", label: "Designers", icon: "designers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/sync-runs", label: "Sync runs", icon: "sync" },
      { href: "/reviews", label: "Reviews", icon: "reviews" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: "settings" }],
  },
];
