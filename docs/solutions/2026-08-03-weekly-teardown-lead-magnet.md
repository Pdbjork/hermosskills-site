# Weekly teardown lead magnet for operator funnel

Date: 2026-08-03

## Problem

The Operator-as-a-Service funnel had a high-intent application form and a sample report, but no lower-friction capture path for founders who are curious and not ready to apply for the $2,500 pilot. With 0 qualified operator leads and $0 revenue, the page needed a measurable next step between “read proof” and “apply.”

## Change

Added a weekly operator teardown CTA to:

- `/operator/` below the week-one deliverables proof card
- `/operator/sample-report/` near the closing CTAs

The CTA points to the existing human-reviewed contact flow with prefilled subject/message and UTM markers:

- `utm_medium=lead_magnet`
- `utm_campaign=weekly_teardown`

This reuses `/api/contact` instead of introducing an unverified newsletter backend. It does not imply automated email signup; the copy states “no list signup, no automation, just a human-reviewed reply.”

## Guardrails preserved

- No guaranteed-revenue claim.
- No automated outbound or unattended email claim.
- No secret, token, customer, or private lead data exposed.
- Contact consent remains required on the existing contact form.

## Verification

- `npm test` passed all repo tests after adding a regression test for the lead magnet.
- A local static href scan passed for the changed operator pages.
- VPS mirror deployed and public URLs returned 200:
  - `https://hermosskills.com/operator/`
  - `https://hermosskills.com/operator/sample-report/`
- Public HTML checks confirmed the teardown CTA text appears on both pages.

## Reuse rule

When a paid service funnel has a concrete proof page but zero qualified leads, add a middle-intent lead magnet that captures “send me an example” before pushing more outbound traffic. Prefer an existing consent-first contact/review path over adding a new subscriber system unless the backend and privacy language are already ready.
