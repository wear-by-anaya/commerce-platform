/** Only show logo assets that have a usable aspect ratio for UI slots. */
export const BRAND_MARK = {
  src: "/brand-mark.png",
  width: 32,
  height: 32,
  /** Square WA monogram (latest store favicon). */
  show: true,
} as const;

/** Wide wordmark — native ~398x168 aspect, transparent SVG. */
export const BRAND_LOGO = {
  src: "/brand-logo.svg",
  width: 140,
  height: 59,
  show: true,
} as const;
