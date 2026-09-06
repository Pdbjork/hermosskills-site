# Answer-ready operator FAQ and JSON-LD

Date: 2026-09-06
Project: Hermosskills

## Problem

The operator funnel had strong proof-first CTAs and an inline teardown form, but the homepage and weekly teardown page did not expose structured data that AI/search crawlers can quote when founders ask:

- what Hermosskills does,
- whether there is a lower-friction step before the $2,500 pilot,
- what stays approval-gated,
- how the loop measures revenue/follower/subscriber/lead movement.

## Change

- Added homepage JSON-LD with one `Organization`/`OnlineBusiness` entity and two `Service` entities:
  - Hermosskills Operator-as-a-Service Pilot — $2,500.00
  - Weekly Operator Teardown — $0.00
- Added a visible FAQ section to `/weekly-teardown/` using the same plain-language answers as the `FAQPage` JSON-LD.
- Added regression coverage that parses the JSON-LD blocks and checks the buyer-facing FAQ language remains present.

## Why it matters

This creates a crawlable, answer-ready surface for cautious founders and maintainers who are not ready to apply but may search or ask AI tools about the offer. The free one-URL teardown remains the lowest-friction conversion path, while the structured data makes the paid pilot and consent boundaries easier to cite.

## Reusable pattern

1. Put the real business entity and priced services in homepage JSON-LD.
2. Put visible buyer questions on the proof/FAQ page, not hidden JSON only.
3. Keep answers concrete: price, approval boundary, metric, no-private-data rule, and no-guaranteed-revenue boundary.
4. Parse every JSON-LD block in tests before deploy.

## Verification checklist

- `npm test` passes.
- Every `application/ld+json` block parses with `JSON.parse` / `json.loads`.
- Live homepage contains `Hermosskills Operator-as-a-Service Pilot`.
- Live weekly teardown page contains `FAQPage` and the visible FAQ heading.
