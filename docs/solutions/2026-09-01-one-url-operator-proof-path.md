# One-URL Operator Proof Path — 2026-09-01

## Context

The 2026-09-01 Revenue Command Center report named two high-signal actions:

1. Review/follow up recent Gmail project/outreach candidates.
2. Pick one revenue-page improvement today, specifically Offline Helper checkout/support CTA or Hermosskills operator CTA.

Hermosskills still has 0 qualified operator applications and 0 qualified weekly teardown requests, while raw records are excluded tests. A $2,500 operator application is a high-trust CTA for a cold audience.

## Change shipped

Made the operator CTA proof-first:

- Homepage operator panel now leads with `Send one URL first` instead of asking cold visitors to jump straight into the $2,500 pilot application.
- Operator page now names a `Proof-first path: send one URL before you apply.`
- CTA routes to the existing weekly teardown inline form with UTM campaign `one_url_proof`.
- Copy promises one public-page inspection, one measurable revenue-surface fix, and an approval-queue preview before the full pilot commitment.

## Why it matters

This preserves the high-value $2,500 pilot while giving cold founders a lower-friction conversion path. It should increase qualified signals because a founder can send one public URL without committing to a call, card, or private-data handoff.

## Files changed

- `index.html`
- `operator/index.html`
- `tests/operator-fallback-prefill.test.mjs`

## Verification

- `npm test` passed: 24/24 tests.
- Static HTML parser accepted edited homepage and operator page.
- Internal edited-page links/assets resolve.
- Deployed to `/var/www/hermosskills.com` with backup at `/root/backups/hermosskills-one-url-proof-20260901-090232`.
- Local HTTPS with `--resolve hermosskills.com:443:127.0.0.1` returned 200 for `/` and `/operator/`.
- Public `https://hermosskills.com/` returned 200 and contains `Send one URL first`, `one_url_proof`, and `Proof-first option`.
- Public `https://hermosskills.com/operator/` returned 200 and contains `Proof-first path: send one URL before you apply.`, `utm_medium=one_url_proof`, and `No list signup, no automation, no private data`.
- Public metrics endpoints remain honest: operator stats = 0 qualified / 3 raw / 3 excluded tests; contact stats = 0 qualified / 2 raw / 2 excluded tests / 1 raw weekly teardown.

## Follow-up draft angle

Use this in approval-gated outreach follow-up:

> I made the first step lighter: instead of asking you to consider a $2,500 operator pilot cold, Hermosskills now has a one-URL proof path. Send one public page, and Pete will reply with the first measurable revenue-surface fix and what an approval-gated operator would queue next. No private data, no automation, no list signup.

## Next action

Use the one-URL proof path in the top 3 Gmail follow-ups for maintainer-economics / MCP-conformance / founding-sponsor threads. Do not send until Pete approves the exact recipients and wording.
