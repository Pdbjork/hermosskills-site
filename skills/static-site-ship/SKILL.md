---
name: static-site-ship
description: Ship a redesigned (or new) static website end-to-end on a VPS — design the site, build it, validate it, deploy to a static mirror under /var/www or equivalent, smoke-test nginx (with the right Host header) AND the backend capture service, write a handoff report, and ping the user. Load when the user asks to "redesign", "build", "ship", "deploy", or "publish" a website, especially a research/education/foundation/nonprofit public-facing site where privacy-by-default, consent-first forms, and "no false claims" discipline matter. Skip for SPA / SSR app deploys (Next.js, Vite, etc.) — those have their own build pipelines. Skip for hosted-platform-only deploys (Vercel/Netlify/Cloudflare Pages with no VPS mirror).
version: 1.0.0
author: Hayden Cate
license: MIT
platforms: [linux]
metadata:
  hermes:
    tags: [deploy, static-site, nginx, handoff, vps, foundation, privacy, web, html, css]
    related_skills: [claude-design, design-md, popular-web-designs, public-good-ai-commercialization, stripe-go-live-workflow]
---

# Static Site Ship

Ship a redesigned or new public-facing static website end-to-end. The loop is:
**design → build → validate → deploy to VPS mirror → smoke-test nginx + backend → handoff report → user ping.**

This skill assumes the deliverable is a plain-HTML/CSS/JS site (no build step) deployed to a VPS static mirror under `/var/www/<domain>/` (or equivalent) served by nginx. The mirror may or may not be the production host — sometimes it's a fallback while Vercel/Netlify handles the live domain.

## When to load

Load this skill when the user asks to:

- redesign a foundation / nonprofit / research / education / public-good website
- publish a new landing page, manifesto page, or project site
- ship a privacy-by-default site (consent-first forms, no third-party tracking)
- deploy static HTML/CSS/JS to a VPS mirror at a known domain
- produce a handoff report for an operator to redeploy on Vercel/Netlify

Do NOT load for: SPA / SSR app deploys (use the framework-specific skill); pure-design mockups without deploy (use `claude-design`); token-spec authoring (use `design-md`).

## Operating loop (10 steps)

1. **Read the brief completely.** Brand identity, mission, values, strategic themes, palette, typography, constraints. Note any "do not claim X" rules (e.g. "do not claim 501(c)(3) until incorporated").

2. **Survey what already exists on the VPS and in any related repo.** Read the brand file, the current site files, the express/server capture service if any, the nginx config for the domain, and any archives. Build a mental model of the deploy topology BEFORE writing any HTML.

3. **Confirm scope and tone with the user only if truly ambiguous.** If the user has given enough direction (palette, themes, constraints), do NOT ask an A/B/C menu — ship it. Default behavior is to ship. Ask only when the gap materially changes the deliverable.

4. **Design the system, then build the pages.**
   - Palette + type stack + spacing + radii as CSS variables in one `gbf.css`-style file.
   - Logo mark as inline SVG (no raster). Sacred-scientific / geometric / emblem-style works well for foundation sites.
   - 7–9 pages: index, about, themes (or strategic areas), participate, interest form, thanks, faq, privacy, 404.
   - "Forming" / "seeks" / "explores" language until the org is formally established. Avoid: 501(c)(3) claim, named board members, confirmed donors, named partners, confirmed events, tax-deductible status. Use explicit "not tax-deductible" disclaimers where relevant.

5. **Preserve or improve the existing interest-capture flow.** Posts JSON to `/api/interest` (Vercel/serverless). Falls back to `POST /interest` for VPS express capture. Use consent-first (required `consentToContact` checkbox), hidden honeypot for bots, no third-party tracking, no analytics pixels.

6. **Validate locally before deploy.** Run a script that:
   - walks every `href=` and `src=` and confirms internal targets resolve
   - confirms all `var(--xxx)` CSS references are defined
   - confirms every form-field name in the HTML is read by the JS handler
   - audits text for forbidden claims (501(c)(3), named donors, tax-deductible-as-fact, etc.)
   See `references/validation-script.md` for the template.

7. **Deploy to the VPS mirror.** Backup the existing mirror first, then `cp -a` the new tree over it. Preserve any files you don't know about (`find … -mindepth 1 -delete` is wrong if there's something custom).

8. **Smoke-test the live mirror — the gotcha:** nginx serves name-based virtual hosts, so `curl http://127.0.0.1/...` returns the **default** vhost (404), not the mirror's vhost. Always pass `-H "Host: <domain>"`:
   ```
   curl -sS -H "Host: guardianbuilder.org" \
        -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
   ```
   Walk every page and every asset. Then test the backend capture service directly (port from nginx config `proxy_pass` line):
   ```
   curl -sS -X POST http://127.0.0.1:<port>/api/interest \
        -H "Content-Type: application/json" \
        -d '{"name":"...","email":"...","interestAreas":[...],"consentToContact":true}'
   ```
   See `references/deploy-ritual.md` for the full sequence with expected outputs.

9. **Build the deployable package.** A clean `dist/` tree (HTML + css/js/assets, no dev-time README) AND a zipped archive. Use Python's `zipfile` if `zip` CLI is missing.

10. **Write the handoff report to `/root/HermesVault/<Project>-Redesign-YYYY-MM-DD.md`.** Sections: what shipped (file table with bytes), design choices, validation results, deployment status, blockers, next actions for the user. End with a short Telegram-style summary in the chat reply.

## Status-check discipline (most important pitfall)

**Never trust a session_log / session_search snippet as evidence of on-disk state.** The session log can be truncated mid-stream; the agent may have shipped far more than the last visible tool call shows. Before answering any "where are we?" or "what's the status?" question:

1. `ls -la <project-dir>` to see actual files and timestamps.
2. `wc -c <project-dir>/*.html` to confirm file sizes.
3. Cross-check against the session log; flag mismatches openly.

If the on-disk state is further along than the session log shows, **say so and correct your prior summary**. Don't double-down on the stale read.

Also: when the user asks "where are we?" mid-stream, **don't ask an A/B menu of next actions**. State the verified status, name what's left, and propose to ship. The user picks "ship it now" by default.

## Pitfalls

- **Nginx Host header gotcha** — `curl http://127.0.0.1/` returns the default vhost, not yours. Always `-H "Host: <domain>"` for local smoke tests.
- **Backup the mirror before `find -mindepth 1 -delete`** — there may be files the redesign doesn't know about. `cp -a` first, then rebuild.
- **Form-field drift** — the HTML form names and the JS `data.get(...)` calls must match. Run a consistency check.
- **`var(--xxx)` drift** — defined-but-unused is fine; used-but-undefined is a bug. Scan with a regex.
- **False-claim bleed** — drafting in foundation/education tone invites invented credentials. Audit against a forbidden-phrase list and require explicit "not Y" disclaimers.
- **JS reads multi-value fields with `data.getAll()`, not `data.get()`** — easy to miss in the field-consistency check.
- **`zip` CLI is often missing** on minimal VPS images. Use Python's `zipfile` module.
- **`/api/*` proxy_pass** — nginx forwards to the express service on a local port. The `proxy_pass` line in the nginx site config tells you the port; smoke-test that port directly to verify the backend works independent of nginx.

## Templates

- `templates/interest-form.html` — consent-first interest form scaffold (honeypot, areas fieldset, consent checkbox, status region, privacy note). Copy and rename fields.
- `templates/interest-form.js` — submit handler with `/api/interest` primary + `/interest` fallback, honeypot trap, status states.

## References

- `references/deploy-ritual.md` — the exact deploy + smoke-test sequence with real shell output examples (Host header, nginx config discovery, backend round-trip).
- `references/validation-script.md` — the Python validator that walks links, vars, and form fields.
- `references/handoff-report-template.md` — the report skeleton used for `/root/HermesVault/<Project>-Redesign-YYYY-MM-DD.md`.

## Verification before claiming done

The site is NOT shipped until ALL of the following are true:
- All planned pages exist on disk at the expected sizes.
- Validator reports zero broken links, zero missing assets, zero CSS var drift, zero false claims.
- VPS mirror returns HTTP 200 for every page and every asset (with the correct Host header).
- Backend capture service returns success for a smoke-test POST.
- Handoff report exists at `/root/HermesVault/...`.
- Telegram-style summary in the chat reply.

If any one of those fails, say so explicitly. Don't paper over with "should work" claims.

## Final response shape

Short. Plain text. No markdown headers in the chat reply — this is a CLI terminal.

Include:
- one-line status ("shipped" / "blocked on X" / "degraded: Y works, Z doesn't")
- the deployable artifact path
- the handoff-report path
- any next action that needs the user