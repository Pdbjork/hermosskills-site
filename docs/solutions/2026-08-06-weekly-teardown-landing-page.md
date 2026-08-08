# Weekly teardown landing page

Date: 2026-08-06

## Problem

The Revenue Command Center showed 0 qualified weekly teardown requests and no revenue. The operator funnel had a low-friction teardown CTA, but the direct public route `/weekly-teardown/` returned 404. That left no simple URL for outreach drafts, posts, or homepage traffic.

## Change

Created `/weekly-teardown/` as a dedicated middle-intent landing page for founders who want proof before applying for the $2,500 Operator-as-a-Service pilot.

Updated paths:

- `/weekly-teardown/index.html`
- `/operator/index.html`
- `/operator/sample-report/index.html`
- `/index.html`
- `/tests/operator-fallback-prefill.test.mjs`

The page routes to the existing consent-first contact form with prefilled teardown subject, message, and UTM markers:

- `utm_source=weekly_teardown`
- `utm_medium=landing_page`
- `utm_campaign=weekly_teardown`

## Guardrails

- No automated newsletter claim.
- No guaranteed revenue claim.
- No private lead data, secrets, customer exports, or tokens exposed.
- Contact stays human-reviewed and approval-bound.
- Baseline metrics stay honest: $0 confirmed revenue and 0 qualified teardown requests.

## Verification

- `npm test` passed.
- Python HTMLParser accepted the changed HTML files.
- Static internal link scan passed with 0 missing internal links.
- Stop Slop em-dash check passed for the new page.
- Public deployment returned 200 for `https://hermosskills.com/weekly-teardown/` after rsync to `/var/www/hermosskills.com`.

## Reuse rule

When a funnel has a middle-intent CTA that points to a form, also give it a shareable landing page. Direct URLs help outreach drafts, posts, and analytics. Keep the form backend unchanged unless capture is the actual blocker.
