"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title, which "Save as PDF" uses as the file name (e.g. "Invoice INV-0002 Ayesha Khan").
 * Characters that are not allowed in file names are dropped.
 */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    const previous = document.title;
    document.title = title.replace(/[\\/:*?"<>|#]+/g, "").replace(/\s+/g, " ").trim();
    return () => {
      document.title = previous;
    };
  }, [title]);
  return null;
}
