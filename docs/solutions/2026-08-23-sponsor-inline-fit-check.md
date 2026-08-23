# Hermosskills sponsor inline fit-check form — 2026-08-23

## Problem

The sponsor brief explained the $49/mo, $250/mo, and $500 deposit options, but the main action was still either jump straight to checkout or leave for the general contact form. With $0 revenue and 0 Hermosskills sponsor charges, that is too much commitment for a cold or lightly warm reader.

## Pattern shipped

Add a tiny sponsor-specific form directly on the sponsor brief:

- asks for email,
- asks which tier the reader is considering,
- asks one skill category or proof question,
- posts to the existing `/api/contact` human-review queue with `intent: sponsor`,
- tags the lead with `utm_source=sponsor`, `utm_medium=inline_form`, `utm_campaign=sponsor_fit`, and tier in `utm_content`,
- repeats that this is not a newsletter signup and nothing is sent automatically.

## Why it matters

This turns the sponsor page from “read then decide whether to pay” into “read then ask the one thing needed to believe the offer.” It creates a measurable lead event without charging a card or sending outbound messages.

## Safety boundary

- No automatic email replies.
- No newsletter/list signup.
- No secret or private-data request.
- Human review before any response.

## Verification checklist

- Page contains `#sponsor-question` and `#sponsor-fit-form`.
- Form posts to `/api/contact` with `intent: sponsor`.
- UTM tags identify the sponsor-fit inline form.
- Tests cover the form and tracking fields.
- Live `/sponsor/` page contains the new form after deploy.
