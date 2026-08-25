# Maintainer-economics forwardable pitch — 2026-08-25

## Context

The Revenue Command Center surfaced 20 recent Gmail project/outreach candidates. The highest repeated subject lane was maintainer economics for agent skills and the one-page sponsor pitch. External sends remain approval-gated, so the shippable move was to make the outreach destination clearer and safer before Pete approves any replies.

## Change

Added a public forwardable page:

- `/sponsor/maintainer-economics/`

The page explains:

- why maintained AI-agent skills need an economics layer;
- the $49/mo, $250/mo, and $500 deposit paths;
- the 30% public-good rebate;
- what sponsorship does not buy;
- a copy/paste follow-up block that must be thread-reviewed before sending.

Linked it from:

- `/sponsor/` hero and body;
- homepage commission panel.

## Safety boundaries

- No outbound email was sent.
- No Gmail draft was created.
- No private recipient details were published.
- Copy explicitly says thread review is required before sending.
- No fake logos, endorsements, or customer proof were invented.

## Verification

- `npm test` covers the new page and links.
- Local HTML parse passed for changed HTML files.
- Local internal link check passed for changed HTML files.
- Changed-file secret scan passed.
- `git diff --check` passed.

## Reuse

When a command-center report shows repeated outreach subjects that ask “would you read the 1-page pitch?”, ship a public, generic, non-recipient-specific pitch page first. Then put approval-gated follow-up copy in the vault. This gives Pete a clean URL to send without leaking private thread context or pressuring cold checkout.
