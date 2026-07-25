# Form-first contact capture for revenue pages

Date: 2026-07-25

## Context

Hermosskills had several revenue/support CTAs that depended on `mailto:team@hermosskills.com`, while the working mailbox was not verified in this Hermes profile. That is risky for conversion because buyer, refund, privacy, and sponsor questions can disappear into an uncertain channel.

## Change pattern

- Add a first-party `/contact/` page for short human-reviewed requests.
- Add a narrow `/api/contact` endpoint instead of broadening all `/api/*` at nginx.
- Store submissions in local JSONL under `/var/lib/hermosskills`.
- Create a `needs_human_review` task and alert for each contact submission.
- Never auto-send outbound email from the endpoint.
- Rate-limit write attempts by client key.
- Keep request bodies bounded:
  - name: 120 chars
  - subject: 160 chars
  - URL: 500 chars
  - message: 1200 chars
  - user agent: 240 chars
- Prioritize refund/privacy/urgent requests as high priority.

## Verification checklist

- `npm test` covers sanitize/build/record contact-task helpers.
- HTML parser validates changed pages.
- Live `/contact/` returns 200 and contains the form.
- Live `/api/contact` accepts a smoke-test POST, then smoke-test JSONL rows are removed.
- Live `/api/contact` rejects invalid consent.
- Search confirms no `mailto:team@hermosskills.com`, `Prefer email`, or stale monitored-inbox claims remain in HTML.

## Nginx note

Hermosskills intentionally allowlists API routes. When adding a new API endpoint, update `/etc/nginx/sites-available/hermosskills.com` and reload nginx after `nginx -t`. Do not open the fallback `/api/` location broadly.
