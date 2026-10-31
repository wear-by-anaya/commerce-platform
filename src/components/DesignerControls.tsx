"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { checkBrandAction, checkOldestAction, togglePartnerAction } from "@/app/designers/actions";
import { Icon } from "./icons";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";

/** Partner tick: saves straight away. */
export function PartnerToggle({ slug, name, partner }: { slug: string; name: string; partner: boolean }) {
  const [checked, setChecked] = useState(partner);
  const [pending, startTransition] = useTransition();
  return (
    <label className={form.check}>
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);
          const data = new FormData();
          data.set("slug", slug);
          if (next) data.set("partner", "on");
          startTransition(() => togglePartnerAction(data));
        }}
        aria-label={`${name} is a partner`}
      />
      <span>Partner</span>
    </label>
  );
}

function Submit({ label, busy, primary }: { label: string; busy: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primary ? buttons.button : buttons.secondary} disabled={pending} aria-busy={pending}>
      {pending ? busy : label}
    </button>
  );
}

/** Checks one brand's website now (takes a few seconds). */
export function CheckBrandButton({ slug }: { slug: string }) {
  return (
    <form action={checkBrandAction}>
      <input type="hidden" name="slug" value={slug} />
      <Submit label="Check" busy="Checking…" />
    </form>
  );
}

/** Checks the 5 brands checked longest ago (up to a few minutes). */
export function CheckOldestButton() {
  return (
    <form action={checkOldestAction}>
      <Submit label="Check 5 oldest" busy="Checking 5 brands…" primary />
    </form>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
      <Icon name="external" size={14} />
    </a>
  );
}
