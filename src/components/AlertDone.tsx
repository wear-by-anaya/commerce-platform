"use client";

import { useTransition } from "react";
import { markAlertAction } from "@/app/reviews/actions";
import buttons from "./ui/Button.module.css";

/** "Mark done" for one alert, or "Open again" for one already done. */
export function AlertDone({ alertKey, title, done }: { alertKey: string; title: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  const save = () => {
    const data = new FormData();
    data.set("key", alertKey);
    if (!done) data.set("done", "on");
    startTransition(() => markAlertAction(data));
  };
  return (
    <button type="button" className={buttons.secondary} disabled={pending} onClick={save} aria-label={`${done ? "Open again" : "Mark done"}: ${title}`}>
      {pending ? "Saving…" : done ? "Open again" : "Mark done"}
    </button>
  );
}
