# Weekly teardown above-fold CTA pattern

Date: 2026-08-11

## Problem

The operator funnel had a lower-commitment weekly teardown page and working contact stats, but the homepage still led with sponsor/operator commitment CTAs above the fold. With zero qualified leads, the lowest-friction lead path needed to appear before the paid application path.

## Change

Changed paths:

- `/index.html`
- `/tests/operator-fallback-prefill.test.mjs`

Homepage changes:

- Added `Weekly teardown` to the main nav with `utm_medium=nav`.
- Added a hero badge: `Weekly operator teardown now open`.
- Made `Get weekly teardown` the first hero CTA with `utm_medium=hero`.
- Kept paid operator application visible as the second CTA.
- Added a short hero strip explaining the low-friction ask and linking with `utm_medium=hero_strip`.

## Verification

- `npm test` passed with 17 tests.
- `git diff --check` passed.
- `node --check server.mjs` and `node --check tests/operator-fallback-prefill.test.mjs` passed.
- Python `HTMLParser` parsed `index.html`, `weekly-teardown/index.html`, `contact/index.html`, and `operator/index.html`.
- Internal static ref check passed when excluding dynamic endpoints and private media.
- Public `https://hermosskills.com/?v=46002e5` returned 200 and contained the new hero badge, nav UTM, hero UTM, and hero strip.
- Public `https://hermosskills.com/weekly-teardown/?v=46002e5` returned 200.
- Public `/api/contact/stats` returned aggregate counts only and showed `weekly_teardown_count: 0`.

## Reuse rule

When a product has zero qualified leads, the homepage should not lead with the highest-commitment paid action only. Put the lowest-friction proof request above the fold, keep the paid CTA adjacent, and track each surface with distinct UTMs (`nav`, `hero`, `hero_strip`, panel CTAs) so later lead source can be attributed without exposing private lead records.
