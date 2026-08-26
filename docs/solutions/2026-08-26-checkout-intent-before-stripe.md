# Checkout intent before Stripe — 2026-08-26

## Problem

The homepage commission panel let a buyer open Stripe without naming the skill/category or proof question they wanted handled first. That made the first fulfillment task too generic and weakened the sponsor follow-up path.

## Change

- Added a lightweight checkout intent form directly above the homepage sponsor/commission buttons.
- Captures optional email, required skill/category/proof note, and an explicit human-review boundary acknowledgement before opening Stripe.
- Sends `{ plan, email, note }` to `/api/create-checkout-session`.
- Preserves `metadata.note` in `buildFulfillmentTask()` as `sponsor_note` so checkout-completed fulfillment tasks carry the buyer's requested skill/category.
- Updated the Stripe SDK API version to `2026-04-22.dahlia` per current Stripe best-practice guidance.

## Safety boundaries

- No email is sent automatically.
- No public sponsor claim is made from checkout alone.
- The buyer sees that Pete verifies fit before disclosure/public claims.
- Secret values were not read or written.

## Verification

- `npm test` -> 21 tests passed.
- `git diff --check` -> passed.
- Python `HTMLParser` parsed changed HTML pages.
- Changed-file secret scan for common live key/token prefixes -> passed.

## Reuse pattern

When a static checkout button represents a sponsor/commission offer, add a tiny pre-checkout intent form if the fulfillment queue needs context that Stripe alone will not collect. Store short bounded metadata on the Checkout Session and copy it into the local human-review fulfillment task after `checkout.session.completed`.
