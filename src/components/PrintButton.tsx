"use client";

import buttons from "./ui/Button.module.css";

export function PrintButton() {
  return (
    <button type="button" className={buttons.button} onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
