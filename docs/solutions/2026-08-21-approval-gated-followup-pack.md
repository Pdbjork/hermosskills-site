# Approval-gated follow-up pack pattern — 2026-08-21

## Context

Hermosskills has live revenue surfaces but zero qualified leads and zero charges. The Revenue Command Center surfaced recent Gmail project/outreach candidates, but outbound messages require human approval and the VPS could not safely create live Gmail drafts because Google Workspace OAuth was not authenticated and Himalaya lacked its IMAP password file.

## Pattern

When distribution is the bottleneck and email tooling is blocked:

1. Use only metadata from the command-center report unless the mailbox can be read safely.
2. Group threads by intent lane, not by every subject variant.
3. Write one short reply per lane.
4. Route low-commitment prospects to `/weekly-teardown/`.
5. Route funder/maintainer prospects to `/sponsor/` or `/audit/`.
6. Keep every draft approval-gated and require thread-body review before send.
7. Record the pack in the vault, not on the public site, to avoid leaking target-specific outreach material.

## Artifact created

`/root/HermesVault/Hermosskills-Gmail-Followup-Approval-Pack-2026-08-21.md`

## Safety boundaries

- No email was sent.
- No Gmail draft was created.
- No thread body text was fetched.
- No private contact details were published.
- Drafts use recipient placeholder `NAME` and require Pete approval before send.

## Verification checklist

- Count at least 5 reusable draft lanes.
- Confirm no secret-looking tokens or passwords appear.
- Confirm all links point to public Hermosskills pages.
- Confirm the daily focus note names email-tool blockers plainly.
