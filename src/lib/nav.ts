export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "orders" | "inventory" | "designers" | "sync" | "reviews" | "settings" | "bell" | "chart";
  badgeCount?: number;
  badgeTone?: "neutral" | "accent" | "warning";
  /** Page not built yet; shown with a "planned" badge. */
  planned?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/updates", label: "Updates", icon: "bell" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/orders", label: "Orders", icon: "orders" },
      { href: "/invoices", label: "Invoices", icon: "orders" },
      { href: "/profit", label: "Profit", icon: "chart" },
      { href: "/costs", label: "Costs", icon: "inventory" },
      { href: "/inventory", label: "Inventory", icon: "inventory", planned: true },
      { href: "/designers", label: "Designers", icon: "designers", planned: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/sync-runs", label: "Sync runs", icon: "sync", planned: true },
      { href: "/reviews", label: "Reviews", icon: "reviews", planned: true },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: "settings" }],
  },
];
