"use client";

import { useSearchParams } from "next/navigation";

export function LoginError({ className }: { className?: string }) {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p className={className} role="alert">
      {error === "AccessDenied"
        ? "This Google account does not have access. Ask the owner to add it."
        : "Sign-in did not work. Please try again."}
    </p>
  );
}
