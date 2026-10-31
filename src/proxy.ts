export { auth as proxy } from "@/auth";

// Everything needs a login except the login page, the login API and static files.
// Exact names only, so a path like "/login-anything" or "/icon-anything" still needs a login.
export const config = {
  matcher: [
    "/((?!login$|api/auth/|_next/static/|_next/image|favicon[^/]*\\.png$|apple-icon\\.png$|icon\\.png$).*)",
  ],
};
