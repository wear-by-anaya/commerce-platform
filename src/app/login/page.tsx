import type { Metadata } from "next";
import { Suspense } from "react";
import { signIn } from "@/auth";
import { LoginError } from "@/components/LoginError";
import { STORE_BRAND } from "@/lib/config";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{STORE_BRAND}</h1>
        <p className={styles.text}>Operations. Team members only.</p>
        <Suspense fallback={null}>
          <LoginError className={styles.error} />
        </Suspense>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button type="submit" className={styles.button}>
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
