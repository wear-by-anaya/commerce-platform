"use client";

import { useState, useTransition } from "react";
import { reviewUpdateAction } from "@/app/costs/actions";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";
import styles from "./UpdatesList.module.css";

/** "Reviewed" tick for one update; once ticked, a note says what we changed in our stores or apps (if anything). */
export function UpdateReview({ itemKey, title, review }: { itemKey: string; title: string; review?: { by: string; at: string; note: string } }) {
  const [checked, setChecked] = useState(Boolean(review));
  const [note, setNote] = useState(review?.note ?? "");
  const [pending, startTransition] = useTransition();
  const when = review ? new Date(review.at).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" }) : "";

  // Sends exactly what is on screen, so a quick tick/untick never reads a stale form.
  const save = (reviewed: boolean, text: string) => {
    const data = new FormData();
    data.set("key", itemKey);
    if (reviewed) {
      data.set("reviewed", "on");
      data.set("note", text);
    }
    startTransition(() => reviewUpdateAction(data));
  };

  return (
    <div className={styles.review}>
      <label className={form.check}>
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(event) => {
            setChecked(event.target.checked);
            save(event.target.checked, note);
          }}
          aria-label={`Reviewed: ${title}`}
        />
        <span>{review ? `Reviewed by ${review.by}, ${when}` : "Reviewed"}</span>
      </label>
      {checked ? (
        <form
          className={styles.note}
          onSubmit={(event) => {
            event.preventDefault();
            save(true, note);
          }}
        >
          <input
            className={form.control}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="What we changed (or: nothing needed)"
            aria-label={`What we changed for: ${title}`}
          />
          <button type="submit" className={buttons.secondary} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
