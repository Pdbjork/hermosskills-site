# Maintainer follow-up reply paths — 2026-08-30

## Problem

The Revenue Command Center surfaced 20 recent Gmail project/outreach candidates around Hermosskills maintainer economics, MCP conformance critique, founding sponsor slots, and public-good funding. Sending emails still requires human approval, but the public pitch page could do more work before any send by giving busy maintainers one-click, structured reply paths.

Without those paths, every follow-up asks the recipient to compose a thoughtful answer from scratch. That is friction at the exact point where Hermosskills needs one of three measurable signals: the first skill/category to maintain, a critique of the audit workflow, or the proof needed before sponsorship.

## Change

- Added a `#reply-paths` section to `/sponsor/maintainer-economics/`.
- Added three contact-form prefill CTAs:
  - `utm_content=first_skill` — suggest the first skill/category to maintain.
  - `utm_content=audit_critique` — critique the Hermosskills audit workflow.
  - `utm_content=proof_request` — name the evidence needed before sponsoring.
- Kept every CTA routed through the existing human-reviewed contact form. No outbound email, sponsor claim, endorsement, or public naming happens automatically.
- Added regression coverage in `tests/operator-fallback-prefill.test.mjs` so the reply paths do not disappear silently.

## Revenue/follower/subscriber impact

This is a revenue-supporting conversion bridge, not a traffic play. It gives Uncle Pete a safer follow-up target for the existing outreach queue and turns maintainer replies into categorized, measurable sponsor/contact leads.

Expected near-term metric: `contact/stats.by_intent.sponsor` and raw/qualified contact lead counts after approved outreach. Current live baseline before any approved send remains 0 qualified Hermosskills leads, with test submissions excluded.

## Safety and approval boundary

- External Gmail, LinkedIn, Slack, Skool, or DM follow-ups still require Uncle Pete approval of the exact recipient/channel/copy.
- Contact form submissions are human-reviewed before any reply.
- The public page does not imply sponsorship, endorsement, quote permission, or partnership.

## Verification

Run from `/root/repos/hermosskills-site`:

```bash
npm test
curl -sS -L https://hermosskills.com/sponsor/maintainer-economics/ | grep -E 'reply-paths|utm_content=first_skill|utm_content=audit_critique|utm_content=proof_request'
curl -sS https://hermosskills.com/api/contact/stats
```

Expected signals:

- Tests pass, including `maintainer economics pitch has structured reply paths for outreach follow-up`.
- Live pitch page returns HTTP 200 and contains the three reply-path CTAs.
- `/api/contact/stats` stays aggregate-only and excludes test submissions from qualified counts.
