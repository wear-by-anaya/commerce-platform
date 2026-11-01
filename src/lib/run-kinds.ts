// Kinds and outcomes of a sync run. No server imports: the "Log a run" form (a client component) uses them too.
export const RUN_KINDS = [
  { value: "import", label: "Import" },
  { value: "unstitched", label: "Unstitched batch" },
  { value: "brand-check", label: "Brand check" },
  { value: "new-arrivals", label: "New Arrivals rebuild" },
  { value: "other", label: "Other" },
] as const;
export const RUN_STATUSES = [
  { value: "ok", label: "Done" },
  { value: "partial", label: "Done with errors" },
  { value: "failed", label: "Failed" },
] as const;

export type RunKind = (typeof RUN_KINDS)[number]["value"];
export type RunStatus = (typeof RUN_STATUSES)[number]["value"];

export const kindLabel = (kind: string) => RUN_KINDS.find((k) => k.value === kind)?.label ?? kind;
export const statusLabel = (status: string) => RUN_STATUSES.find((s) => s.value === status)?.label ?? status;
export const isKind = (value: string): value is RunKind => RUN_KINDS.some((k) => k.value === value);
export const isStatus = (value: string): value is RunStatus => RUN_STATUSES.some((s) => s.value === value);
