export { auth as proxy } from "@/auth";

// Everything needs a login except the login page, the login API and static files.
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon|apple-icon|icon|.*\\.(?:png|jpg|svg|ico|webp)$).*)",
  ],
};
