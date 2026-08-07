# Contact stats endpoint for weekly teardown funnel

Date: 2026-08-07

## Problem

The weekly teardown landing page could send qualified requests through the contact form, but public monitoring stopped at a 404:

- `/api/contact/stats` returned 404.
- `/api/weekly-teardown/stats` returned 404.
- The page had to hard-code `0` instead of loading the same filtered public-proof style used by operator applications.

This made the revenue funnel harder to monitor after distribution starts.

## Change

Added contact-form public aggregate stats without exposing private lead data.

Changed paths:

- `/server.mjs`
- `/weekly-teardown/index.html`
- `/tests/webhook-fulfillment.test.mjs`
- `/tests/operator-fallback-prefill.test.mjs`
- `/etc/nginx/sites-available/hermosskills.com`

New server helpers:

- `isLikelyTestContactLead(lead)` excludes smoke/test contacts from public proof metrics.
- `isWeeklyTeardownContactLead(lead)` identifies teardown requests from UTM, subject, or message.
- `buildContactLeadStats(leads)` returns aggregate-only counts: qualified contacts, raw contacts, excluded tests, weekly teardown qualified/raw, and by-intent counts.

New endpoints:

- `/api/contact/stats`
- `/api/weekly-teardown/stats`

The response contains counts only. It does not expose names, emails, notes, URLs, IPs, user agents, or full rows.

## Front-end behavior

`/weekly-teardown/` now loads `/api/contact/stats` and replaces the metric cards with live filtered counts. If stats are unavailable, the page keeps safe fallback copy and still routes requests through the contact form.

## Verification

- `npm test` passed with 17 tests.
- `node --check` passed for server and test files.
- Python `HTMLParser` accepted the changed weekly teardown page.
- `nginx -t` passed before reload.

## Reuse rule

When a lead magnet routes to a shared contact form, give it a public aggregate stats endpoint before distribution starts. Count the funnel-specific requests from UTM and plain-language subject/message so referrer drift does not hide real leads. Filter test submissions before showing public proof metrics.
