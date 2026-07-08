---
name: regulated-fintech-product-development
description: "Plan and prototype regulated fintech products simulation-first without prematurely crossing banking, card, payroll, or money-movement boundaries."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [fintech, regulated-products, simulation, mvp, compliance, cards, payroll, budgeting]
---

# Regulated Fintech Product Development

Use this umbrella for fintech ideas involving cards, payroll, budgeting controls, vulnerable-user safeguards, lending, banking, or money movement. The default stance is simulation-first: validate the workflow and user value without handling funds or implying licensed capabilities.

## Guardrails

- Do not present legal advice; flag regulatory questions for counsel/compliance review.
- Prototype with mock ledgers, simulated authorizations, sandbox providers, and manual review queues before real accounts/cards/payroll rails.
- Separate product UX validation from regulated operations.
- Make risk boundaries explicit in copy, architecture, and demos.

## Workflow

1. Define the regulated surface: funds custody, card issuing, payroll access, credit, identity/KYC, vulnerable-user controls, or financial advice.
2. Pick a non-regulated MVP slice: education, budgeting simulation, alerts, consent capture, fit-check, or decision-support without execution.
3. Build a prototype with fake data and clearly labeled sandbox states.
4. Document compliance assumptions, provider options, handoff points, and what must be true before integrating live rails.
5. Use market scans and phase plans as references, not as blanket permission to launch.

## Preserved detailed references

- `references/regulated-fintech-mvp.md`
- `references/regulated-fintech-prototyping.md`
- `references/budget-guard-card-market-scan.md`
- `references/budget-guard-card-phase1.md`
