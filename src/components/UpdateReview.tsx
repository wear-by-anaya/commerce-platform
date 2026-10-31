"use client";

import { useRef, useState } from "react";
import { reviewUpdateAction } from "@/app/costs/actions";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";
import styles from "./UpdatesList.module.css";

/** "Reviewed" tick for one update; once ticked, a note says what we changed in our stores or apps (if anything). */
export function UpdateReview({ itemKey, title, review }: { itemKey: string; title: string; review?: { by: string; at: string; note: string } }) {
  const [checked, setChecked] = useState(Boolean(review));
  const ref = useRef<HTMLFormElement>(null);
  const when = review ? new Date(review.at).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" }) : "";
  return (
    <form ref={ref} action={reviewUpdateAction} className={styles.review}>
      <input type="hidden" name="key" value={itemKey} />
      <label className={form.check}>
        <input
          type="checkbox"
          name="reviewed"
          checked={checked}
          onChange={(event) => {
            setChecked(event.target.checked);
            // Save straight away; the note can be added after.
            requestAnimationFrame(() => ref.current?.requestSubmit());
          }}
          aria-label={`Reviewed: ${title}`}
        />
        <span>{review ? `Reviewed by ${review.by.split("@")[0]}, ${when}` : "Reviewed"}</span>
      </label>
      {checked ? (
        <div className={styles.note}>
          <input
            className={form.control}
            name="note"
            defaultValue={review?.note ?? ""}
            maxLength={500}
            placeholder="What we changed (or: nothing needed)"
            aria-label={`What we changed for: ${title}`}
          />
          <button type="submit" className={buttons.secondary}>
            Save
          </button>
        </div>
      ) : null}
    </form>
  );
}
