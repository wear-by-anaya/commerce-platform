# wba-commerce-platform

**Internal tool: the code is public, the data is not.** — Wear By Anaya Operations Platform boilerplate.

## Notices

- No credentials belong in this repository.
- Every page needs a Google sign-in from an email in `ALLOWED_EMAILS` (set in Vercel, never in this repo).
- Shopify, database, and stock workers are **NOT CONNECTED**.
- Do not copy secrets or production data from other projects.
- Shared commerce engine integration is deferred until after #28D production rollout review.

## Identity

- `STORE_SLUG=wba`

## Scripts

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Structure

```text
src/app/          App Router pages
src/components/   UI shell
src/lib/          shopify / auth / db placeholders
src/types/
docs/
```
