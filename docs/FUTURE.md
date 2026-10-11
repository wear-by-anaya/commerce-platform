# Future architecture — Wear By Anaya

## Status

Boilerplate only. No production integrations.

## Proposed future entities

- users
- stores
- orders
- products
- variants
- inventory observations
- source products
- source variants
- sync runs
- sync events
- reviews
- alerts

## Isolation

- STORE_SLUG=`wba`
- Own Shopify connection, database, auth, Vercel project, and workers
- No shared private data with the other company application
- Shared engine integration only after #28D rollout review, via pinned version

## Explicitly not in this repo yet

- Production authentication
- Shopify Admin API / webhooks
- Databases
- Stock workers / cron
- Customer or order data
