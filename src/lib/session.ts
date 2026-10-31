import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { recordSeen, seenRecently, visitor } from "@/lib/audit";

/**
 * Second check behind the proxy: every server function that reads store data
 * or changes saved data calls this first, so a gap in the proxy matcher never exposes data.
 * It also notes the person's device as "seen" (at most once a minute, after the response is sent).
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const email = session.user.email;
  const v = await visitor();
  if (!seenRecently(email, v)) after(() => recordSeen(email, v));
  return session.user;
}
