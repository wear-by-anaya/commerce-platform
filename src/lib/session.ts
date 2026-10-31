import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Second check behind the proxy: every server function that reads store data
 * or changes saved data calls this first, so a gap in the proxy matcher never exposes data.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  return session.user;
}
