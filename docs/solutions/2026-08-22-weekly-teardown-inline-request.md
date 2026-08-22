# Weekly teardown inline request form — 2026-08-22

## Problem

The weekly teardown landing page routed prospects through prefilled contact links. That preserved the human-review boundary, but it added a click and buried the most important conversion inputs inside a long message body.

Current business baseline from the command-center/autonomous reports:

- $0 confirmed revenue.
- 1 tracked subscriber across the portfolio.
- Hermosskills: 0 qualified contact leads, 0 qualified weekly teardown requests, 0 qualified operator applications.

## Change

Added a compact inline request form on `/weekly-teardown/` that asks only for:

1. email,
2. public URL to inspect,
3. first metric the founder cares about,
4. consent.

The form posts to the existing `/api/contact` endpoint with:

- `intent: operator`,
- subject `Send me the weekly operator teardown`,
- UTM `weekly_teardown / inline_form / weekly_teardown / quick_request`,
- a plain message body that includes the public URL and metric.

## Safety boundaries

- No email is sent automatically.
- No list signup is created.
- Submission creates a local human-review task through the existing contact pipeline.
- The page continues to warn users not to send passwords, tokens, private customer exports, recovery keys, bank logins, medical/legal details, or sensitive screenshots.

## Verification

- `npm test` passed: 18/18 tests.
- `git diff --check` passed.
- The existing teardown stats loader still fetches `/api/contact/stats` and excludes test submissions from public proof metrics.

## Reuse pattern

When a lead magnet page is using only prefilled contact links, add an inline form if the prospect can describe the request in 3 fields or fewer. Keep the existing contact links as fallback, but make the first action a same-page submit into a human-review queue.
