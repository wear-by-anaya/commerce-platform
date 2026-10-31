"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import styles from "./SearchBox.module.css";

/**
 * Search field for list pages. Writes ?<param>= into the address after a short pause (so results survive a reload
 * and can be shared) and drops the page/cursor params, so a new search starts on page 1.
 */
function SearchBox({
  placeholder,
  param = "q",
  resetParams = ["page", "p", "after", "before"],
}: {
  placeholder: string;
  param?: string;
  resetParams?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get(param) ?? "";
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (next: string) => {
    const params = new URLSearchParams(search.toString());
    for (const key of resetParams) params.delete(key);
    if (next.trim()) params.set(param, next.trim());
    else params.delete(param);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <form
      role="search"
      className={styles.box}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(value);
      }}
    >
      <Icon name="search" size={18} className={styles.icon} />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => go(next), 350);
        }}
      />
      {pending ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {value ? (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            go("");
          }}
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </form>
  );
}

type SearchProps = { placeholder: string; param?: string; resetParams?: string[] };

/** The search field with a same-size placeholder while the page address loads (no layout jump). */
export function SearchBar(props: SearchProps) {
  return (
    <Suspense fallback={<div className={styles.placeholder} aria-hidden="true" />}>
      <SearchBox {...props} />
    </Suspense>
  );
}
