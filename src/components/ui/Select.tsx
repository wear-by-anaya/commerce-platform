"use client";

import { useEffect, useId, useRef, useState } from "react";
import form from "./Form.module.css";
import styles from "./Select.module.css";

type Option = string | { value: string; label: string };

const norm = (o: Option) => (typeof o === "string" ? { value: o, label: o } : o);

/**
 * Dropdown with our own arrow and open/close animation. Posts its value through a hidden input,
 * so it works inside plain server-action forms. Keyboard: arrows, Home/End, Enter/Space, Escape, letters.
 */
export function Select({
  name,
  options,
  defaultValue,
  value: controlled,
  onChange,
  label,
  ariaLabel,
}: {
  name?: string;
  options: readonly Option[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  ariaLabel?: string;
}) {
  const items = options.map(norm);
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value ?? "");
  const value = controlled ?? own;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = items.find((o) => o.value === value) ?? items[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (next: string) => {
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
    setOpen(false);
    button.current?.focus();
  };

  const openList = () => {
    setActive(Math.max(0, items.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = items.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (event.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else if (event.key === "Enter" || event.key === " ") choose(items[active].value);
    else if (event.key === "Escape") {
      setOpen(false);
      button.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
      return;
    } else if (event.key.length === 1) {
      const start = items.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(event.key.toLowerCase()));
      const any = start >= 0 ? start : items.findIndex((o) => o.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (any >= 0) setActive(any);
      return;
    } else return;
    event.preventDefault();
  };

  return (
    <div className={form.field} ref={root}>
      {label ? (
        <span className={form.label} id={`${id}-label`}>
          {label}
        </span>
      ) : null}
      <div className={styles.wrap} onKeyDown={onKeyDown}>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          ref={button}
          type="button"
          className={`${form.control} ${styles.button}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-labelledby={label ? `${id}-label ${id}-value` : undefined}
          aria-label={label ? undefined : ariaLabel}
          onClick={() => (open ? setOpen(false) : openList())}
        >
          <span id={`${id}-value`} className={styles.value}>
            {selected?.label}
          </span>
          <svg className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          className={`${styles.list} ${open ? styles.open : ""}`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        >
          {items.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`${styles.option} ${i === active ? styles.active : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(o.value)}
            >
              <span>{o.label}</span>
              {o.value === value ? (
                <svg className={styles.tick} viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
