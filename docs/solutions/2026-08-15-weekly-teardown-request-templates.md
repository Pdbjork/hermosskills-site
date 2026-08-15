# Weekly teardown request-template CTA pattern

Date: 2026-08-15

## Problem

Hermosskills had a working weekly teardown lead magnet, but the request path still asked founders to decide what to say in a generic contact form. With `$0` confirmed revenue and `0` qualified teardown/contact leads, the next improvement needed to reduce cognitive load without sending outbound messages automatically.

## Change

Changed paths:

- `/weekly-teardown/index.html`
- `/index.html`
- `/tests/operator-fallback-prefill.test.mjs`

Weekly teardown changes:

- Added a `Pick the teardown that matches the metric` section.
- Added three concrete request templates:
  - checkout/pricing page teardown for paid-conversion friction,
  - subscriber/waitlist path teardown for opt-ins/replies,
  - homepage/offer page teardown for clarity and qualified interest.
- Each template links to the contact form with a prefilled subject/message and distinct `utm_content` value.
- Kept consent-first posture: no newsletter signup claim, no scraping, no automated outbound.

Homepage changes:

- Updated the low-friction strip to name checkout, subscriber, and homepage templates.
- Pointed the strip CTA directly to `#request-templates` so prospects land on the chooser instead of a generic page top.

## Verification checklist

- `npm test` should assert all three template CTAs and homepage anchor link.
- HTML parser should parse `index.html`, `weekly-teardown/index.html`, `contact/index.html`, and `operator/index.html`.
- Static link check should allow dynamic `/api/*` routes and verify local files for internal static routes.
- Public smoke should verify:
  - `https://hermosskills.com/weekly-teardown/` contains `Pick the teardown that matches the metric` and all three `utm_content` values.
  - `https://hermosskills.com/` contains the `#request-templates` CTA.
  - `/api/contact/stats` still returns aggregate counts only.

## Reuse rule

When a lead magnet has zero qualified leads, make the CTA chooser concrete around the prospect's metric. A prospect should be able to click the closest revenue/subscriber/clarity problem and receive a prefilled request that is safe to edit. Track the choice with `utm_content` so later lead records reveal which pain point converted without exposing private lead details.
