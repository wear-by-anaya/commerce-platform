import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Team emails come from the ALLOWED_EMAILS environment variable, never from this public code. */
function allowedEmails() {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      const allowed = Boolean(email && profile?.email_verified && allowedEmails().includes(email));
      // Loaded only here, so the proxy does not pull in the database driver.
      const { logEvent } = await import("@/lib/audit");
      await logEvent(email ?? "unknown", allowed ? "signed in" : "sign-in refused", allowed ? "" : "email not on the team list");
      return allowed;
    },
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },
});
