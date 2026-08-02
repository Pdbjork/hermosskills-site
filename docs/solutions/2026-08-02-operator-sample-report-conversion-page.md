# Operator sample report conversion page

Date: 2026-08-02

## Problem

The Operator-as-a-Service funnel named daily revenue command reports as a week-one deliverable, but skeptical buyers could not inspect the artifact before applying. That left the $2,500 pilot feeling abstract even after the readiness checklist and one-page brief.

## Change

Added a public sample report page at `/operator/sample-report/` and linked it from the operator page, pilot brief, and readiness checklist.

The page shows:

- honest starting metrics, including `$0` profit and `0` subscribers when that is the baseline
- what changed in a typical daily operator pass
- verification commands and public URL checks
- approval-needed section for outbound drafts
- next-best-action framing tied to subscriber capture
- direct CTA back to the Standard pilot application with UTM attribution

## Guardrails preserved

- No private lead/customer data shown.
- No claim of guaranteed revenue.
- No claim that outbound emails, posts, DMs, deploys, or payments happen without approval.
- Sample metrics are explicitly illustrative and reality-based, not invented traction.

## Verification

- `npm test` passes all repo tests.
- The new test asserts that the sample report is linked from the funnel and names honest metrics.

## Reuse rule

When selling an operator/service product, make the included reporting artifact inspectable before the fit call. Buyers trust concrete handoff evidence more than broad “AI ops” promises.
