# Redacted fulfillment stats and webhook health — 2026-08-27

## Problem

The revenue loop needs to know whether paid checkouts and high-intent forms are becoming human-review tasks without exposing customer email, private notes, Stripe IDs, or raw messages in public/status surfaces.

A second operational risk: `/api/health` only confirmed Stripe Checkout configuration. It did not reveal whether the Stripe webhook signing secret was configured, so a site could appear checkout-ready while completed sessions would not create fulfillment tasks.

## Change

- Added `buildFulfillmentStats()` to summarize local JSONL task queues by count, status, priority, source, and checkout plan.
- Added `GET /api/fulfillment/stats` returning only redacted aggregate counts.
- Extended `GET /api/health` with `webhookConfigured` and `fulfillmentQueueConfigured` so missing webhook setup is visible during ops checks without exposing local filesystem paths.
- Added regression coverage that stats are aggregate-only and count open human-review tasks.

## Privacy and safety boundary

The stats endpoint intentionally returns counts only. It does not return customer email, sponsor notes, contact subjects/messages, checkout session IDs, event IDs, IP addresses, user agents, or raw JSONL records.

## Verification

Run from `/root/repos/hermosskills-site`:

```bash
npm test
git diff --check
curl -sS https://hermosskills.com/api/health
curl -sS https://hermosskills.com/api/fulfillment/stats
```

After deploy/restart, expected signals:

- `/api/health` includes `stripeConfigured` and `webhookConfigured`.
- `/api/fulfillment/stats` returns `{ "ok": true, "redacted": true, "totals": ... }`.
- No private customer fields appear in the stats response.
