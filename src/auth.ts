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
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      return Boolean(email && profile?.email_verified && allowedEmails().includes(email));
    },
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },
});
