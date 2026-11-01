export { auth as proxy } from "@/auth";

// Everything needs a login except the login page, the login API, static files, the daily job
// (api/cron/, which checks CRON_SECRET itself) and the job-script log (api/sync-runs, which checks SYNC_TOKEN itself).
// Exact names only, so a path like "/login-anything" or "/icon-anything" still needs a login.
export const config = {
  matcher: [
    "/((?!login$|api/auth/|api/cron/|api/sync-runs$|_next/static/|_next/image|favicon[^/]*\\.png$|apple-icon\\.png$|icon\\.png$).*)",
  ],
};
