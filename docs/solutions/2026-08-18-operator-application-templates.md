# Operator application template CTA pattern

Date: 2026-08-18

## Problem

The revenue command center still showed Hermosskills at $0 revenue, 0 qualified operator leads, 0 qualified contact leads, and 0 weekly teardown requests. The operator page had a high-intent application, but it still asked a cold founder to compose the whole application from scratch. With no distribution traction yet, the next safe site improvement was to reduce form friction without sending outbound messages or inventing social proof.

## Change

Changed paths:

- `/operator/index.html`
- `/tests/operator-fallback-prefill.test.mjs`

Operator page changes:

- Added three one-click application templates directly above the pilot form:
  - checkout rescue,
  - subscriber growth,
  - ops follow-through.
- Each template pre-fills the structured application fields that usually cause blank-form friction: payments status, budget, bottleneck, approval hours, and four-week goal.
- The template leaves name, email, and live URL for the founder to provide deliberately.
- The template adds a UTM content marker (`application_template_<kind>`) to the payload when no campaign content is already present, so later lead records can show which pain point converted without exposing private notes.

## Verification checklist

- `npm test` should pass.
- Static HTML parser should parse `operator/index.html`.
- Static content checks should find all three `data-application-template` buttons and the `applicationTemplates` JS object.
- Before/after public source exposure probes should verify repo internals are not web-accessible:
  - `/.git/HEAD` returns 404.
  - `/server.mjs`, `/tests/...`, and `/docs/...` return 404.
- Public smoke after deploy should verify:
  - `https://hermosskills.com/operator/` returns 200.
  - Public HTML contains `Use the checkout rescue template`, `Use the subscriber-growth template`, and `Use the ops follow-through template`.
  - `/api/operator-interest/stats` still returns aggregate-only stats.

## Reuse rule

When a revenue form has zero qualified leads, do not only add more persuasive copy. Add a concrete chooser that maps the prospect's pain point to a prefilled, editable application. Reduce the work needed to ask for help while keeping consent, identity, and live URL fields explicit.
