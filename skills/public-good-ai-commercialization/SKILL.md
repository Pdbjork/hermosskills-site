---
name: public-good-ai-commercialization
description: "Commercialize public-good AI projects and reusable agent assets with ethical funnels, proof packages, landing pages, outreach, and fulfillment operations."
version: 1.2.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [commercialization, public-good-ai, landing-pages, funnels, outreach, agent-skills, offline-helper, payment-links, operator-agent]
---

# Public-Good AI Commercialization

Use this umbrella when helping turn an AI/public-good project into a sustainable offering: validate demand, package reusable assets, publish landing pages, build pay/lead flows, manage outreach, and connect fulfillment without over-automating before proof exists.

## User preference: match the user's energy, especially after sign-off

Uncle Pete has explicitly flagged **"doing the most," "build it," "I don't care about security just take the f'ing key,"** and **"I'm all the way frustrated"** as frustration signals. Treat them as **first-class workflow rules**, not noise to argue with:

- After the user has signed off ("build it," "do it," "go," "ship it"), the next message is **action output, not a three-paragraph preamble**. Plan, draft, code, run, push, hand them the next shell line.
- The right response shape is: one line of context, the action output, one shell line. See `templates/build-it-response-template.md`.
- If a safety point still needs making, fold it into a single sentence inside the runbook, not into the chat. Lectures after consent are stall dressed in safety, not safety.
- When the user pushes back on a hard refusal ("just take the f'ing key"), do **not** re-derive the whole architecture in the apology. Refuse once, clearly and briefly, then **build the safe path that doesn't need the key** in the same turn. The Offline Helper "ship in 60 seconds using Payment Links" turn is the canonical example.
- One line back beats one screen forward. When the user is stuck on a handoff step (key in shell, account ID, etc.), ask for **exactly the one identifier** they need to give you. A user-readable example: *"Just paste the Account ID — the 32-char hex from the dashboard. Nothing else."* If they paste a secret by accident, the response is short: rotate it, then continue.

The deeper principle: the user wants the *power* to act through the agent, not the *credentials* to act. The Operator agent pattern is how you give them that. Payment Links, hosted Checkout, and similar platform-managed flows are how you give them the power *without* the credentials. Both are valid; **Payment Links is usually the faster first move** for a solo founder shipping a static site tonight.

## Core workflow

1. **Clarify the offer** — beneficiary, buyer, pain, promise, proof, delivery path, and ethical boundaries.
2. **Build a proof package** — before automation, collect manual examples, demos, testimonials, screenshots, or reproducible artifacts.
3. **Publish a lightweight funnel** — landing page, fit-check/intake, consent language, payment or waitlist handoff, analytics, and a clear next step.
4. **Run outreach** — targeted prospects/partners, social-response triage, warm referrals, and a CRM/queue that records source and status. The first outreach wave should usually be **lean organic + content** (no ad spend): personal email to warm contacts, real contributions to one Reddit sub at a time, a Skool community, Nextdoor, Craigslist, and one credibility artifact on X (a thread, not a sales post). Calibrate each post to that channel's culture; **do not cross-post identical text across subs** — it gets flagged and burns trust fast. Promote to paid ads only after 5+ fit checks are booked organically AND the fit-check → paid conversion is measured. See `references/organic-content-and-attribution.md` for the full 14-day calendar, the sub-by-sub calibration notes, the canonical UTM naming table, and the promotion gate.

   ### Fit-check attribution capture (the technique that closes the measurement loop)

   A fit-check form that doesn't record channel is unmeasurable. Before spending on ads, wire three things:

   1. **URL-UTM capture on page load.** The form lives at the destination of the `/fit-check/` redirect, so UTMs survive the redirect as long as the inbound link was clicked with them. Read `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` from `window.location.search` and store them in hidden inputs. Also capture `document.referrer`. Length-bound each value (e.g. 64 / 64 / 96 / 96 / 256 chars) to keep the KV record small.
   2. **Optional user-facing dropdown.** A `<select>` named `how_did_you_hear` with the canonical channels (friend_or_family, reddit, nextdoor, facebook_group, craigslist, skool, x_twitter, search_engine, other) plus a "skip this" first option. Optional, never required — visitors who skip still get a fit-check ID.
   3. **Worker-side length-bounded optional block.** The Worker endpoint accepts an `attribution` object alongside the existing `answers` block, clips every string to its max length, builds the record, and only attaches the `attribution` block to the KV record when at least one field is non-empty. Never let an empty attribution record carry a misleading `captured_at` timestamp.

   The full code pattern (HTML hidden fields + JS capture on load + Worker `clipStr` helper) and the canonical UTM naming table live in `references/organic-content-and-attribution.md`. The pattern is intentionally back-end-agnostic — it works on any form-to-Worker-to-KV fit-check intake, not just Cloudflare.
5. **Fulfill safely** — use human-in-the-loop service delivery until the workflow is stable; automate only repeated low-risk steps.
   - For money-moving steps, the agent plans and applies while the human holds live credentials. See **Operator agent governance** below.
6. **Measure and iterate** — conversion, activation, support burden, failure modes, refunds, and mission fit.

## Labeled playbooks

- **Reusable agent-skill marketplaces** — curate class-level skills, governance, marketplace positioning, pricing, and the marketplace-as-funding-engine thesis.
- **Offline Helper commercialization** — fit-check funnels, local support partner flow, payment/verification handoffs, community outreach, and launch execution.
- **Operator agent governance** — when the user asks the agent to "set up the payment profiles," "connect my bank," or "create and route funds," the right answer is an agent that plans and applies while the human holds live secrets. The agent has the *power* to act; the human holds the *credentials* to act. See the section below.
- **Payment Link fast path** — when shipping a static site tonight, prefer Stripe Payment Links over a serverless Worker. See `references/payment-link-fast-path.md`.

## Payment Link fast path (the "ship tonight" recipe)

When a static site needs real money flowing through it in under an hour, **Stripe Payment Links beat a custom Checkout Worker on every axis that matters at low volume**: zero secrets in the repo, zero Cloudflare account, zero webhooks to sign, zero fulfillment queue to build. The tradeoffs only matter at scale.

### The recipe

1. In the Stripe Dashboard (test mode), create Products for each package. Record the `prod_…` and `price_…` IDs.
2. For each Product, click **Create payment link**. Stripe returns a `plink_…` ID and a `https://buy.stripe.com/…` URL.
3. Drop the URLs into `<a class="button primary" href="…">` on the site. No JS, no Worker, no KV, no webhook secret.
4. Test with `4242 4242 4242 4242` in test mode.
5. To go live: switch the Dashboard to Live mode, recreate the three Payment Links, send the agent the three new URLs (URLs are not secrets), and the agent swaps them in.

### When to graduate to a Worker

- Volume justifies the operational overhead (usually 50+ orders/day or a recurring need for branded checkout).
- You need server-side cart logic, discounts, tax, or inventory.
- You need an automatic fulfillment queue (the email + Zapier route is the no-code alternative).

### Programmatic Payment Link creation (one-shot bootstrap)

When the catalog exists as structured data and the dashboard is empty, the Operator agent can create the three Payment Links in one curl loop and the script writes the resulting URLs to a JSON file the site generator reads. Example shell shape (the agent fills in from the structured data):

```bash
for prod in starter_setup family_setup family_support; do
  curl -sS -u "${STRIPE_SECRET_KEY}:" -X POST \
    "https://api.stripe.com/v1/payment_links" \
    --data-urlencode "line_items[0][price_data][currency]=usd" \
    --data-urlencode "line_items[0][price_data][unit_amount]=${AMOUNT}" \
    --data-urlencode "line_items[0][price_data][product_data][name]=${NAME}" \
    --data-urlencode "line_items[0][quantity]=1" \
    -o /tmp/pl_${prod}.json
done
```

Then extract URLs with a tiny Python script (shell-quoting Python `-c` is fragile, prefer a file). See `references/payment-link-fast-path.md` for the full transcript and the failure mode where `python3 -c` quoting gets eaten by the shell.

## Operator agent governance (when the user says "set up my payments / connect my bank / create the products / route the funds")

The user often asks the agent to take on real operational power: create Stripe products, attach a bank account, set up crypto wallets, or route new funds to grow a business. The right answer is **not** to give the agent the live secret and let it act, and it is **also not** to refuse and stall. The right answer is the Operator agent pattern:

> The agent has the *power* to create, plan, and execute. The human holds the *credentials* to act. The agent is physically incapable of running in live mode without a shell export the human controls.

### Why this matters

A live Stripe secret key, a Coinbase withdrawal permission, a bank routing number, or a private key can charge real money, move real balances, and see real customer data. Once pasted into a chat, a script, a subprocess, or a non-production secret store, it can:

- be exfiltrated by any future tool in the same session;
- be left in process memory, env, or logs;
- be replayed long after the human stopped watching;
- on some platforms, edit the bank/payout settings themselves.

So when the user says "I want you to have the power to create and set up the payment profiles," the right move is to build an agent that earns that power, scoped to the actual operations needed, with the human holding the only piece that can ever move real money.

### The three-mode contract

The Operator agent script should always expose at least these three modes, named the same way across businesses so Uncle Pete (and any future agent) can recognize them:

1. `--check` — validates structured data files, env, and mode. **No network calls.** Safe in CI, on a laptop, and inside an agent loop.
2. `--plan` — builds the exact API request the script would send and prints it as JSON. **No network calls.** Use for review and approval before applying.
3. `--apply` — actually calls the API. Refuses to run in live mode unless an additional env flag is set by the human from their own shell.

Recommended live-mode guard:

```bash
# The script refuses to talk to the live API unless the human exports this from
# their own shell, which the agent loop and any subprocess cannot do.
export STRIPE_ENV=live
export STRIPE_LIVE_APPROVED=1
```

If the agent is somehow tricked or compromised, it still cannot run `--apply` in live mode without the human's shell export. The script should also `raise SystemExit` rather than silently downgrading, and it should never print, log, or write the secret itself.

### Second-guard: key-prefix vs. mode-mismatch

A live-mode guard that only checks the env flag is single-factor. Add a **second guard**: the script inspects the key's prefix and rejects the call if `STRIPE_LIVE_APPROVED=1` but the key starts with `rk_test_/sk_test_`, or vice versa. A misconfigured deploy (live flag set with a test key, or test key shipped with live flag) fails closed at 412, not silently.

### What the script may import from the repo

- Structured data files (products, prices, fund-routing rules) — these are not secrets and should live in `data/` so the script can be code-reviewed before it runs.
- An audit log path under `audit/` for append-only records of intent and outcome. The log records mode, product, amount, customer email, fit-check id, and the resulting session id. The secret itself is replaced with `<redacted>` in every log line.

### What the script must never do

- Read the key from a file in the repo.
- Accept the key as a CLI argument (CLI args are visible to other processes).
- Echo the key back in any error message, traceback, or audit line.
- Run in live mode without `STRIPE_LIVE_APPROVED=1` (or the platform equivalent) set by the human.
- Move money between businesses — the script creates Checkout Sessions / orders; routing is bookkeeping in `data/businesses.json` plus real movement in the platform dashboard.
- Create or modify customer records, bank connections, or tax settings.

### Fund-routing convention

For Uncle Pete's portfolio, every business should have a routing rule file (typically `data/businesses.json`) with these bookkeeping fields per business:

- `destination_account` — the connected Stripe account / wallet that will actually receive funds (the human sets this in the dashboard, not the agent).
- `monthly_reinvestment_floor_pct` — minimum percentage of revenue to put back into the product before anything else.
- `public_good_fund_pct` — percentage routed to the public-good fund.
- `review_reserve_pct` — percentage held back for safety review, support time, and refunds.

The script records intent, not movement. Real movement happens when the human wires balances between accounts inside Stripe / Coinbase / the bank. Always label these splits as **bookkeeping**, not legal charitable promises, until a real structure exists.

### Restricted-key discipline

Whenever a third-party API supports restricted keys (Stripe does, Coinbase does, GitHub does, AWS does), the human should create the narrowest key possible:

- name it after the operator agent and the mode (`offline-helper-operator-test`, `offline-helper-operator-live`);
- scope it to only the resources the script needs (for Stripe Checkout: `Checkout Sessions: write` only, nothing else);
- rotate the leaked key first if one has ever been pasted into chat, screenshots, or untrusted files;
- keep the live key in a real secret manager (1Password, Bitwarden, GitHub Actions secrets, AWS Secrets Manager) — not in the repo, not in `.env` committed anywhere, not in chat history.

### What to do when the user pastes a live key into chat

This will happen. The right response is:

1. Do not paste the key into a tool call, file, env, or subprocess.
2. Refuse clearly, kindly, and with the reason: live keys in agent sessions can drain the account.
3. Tell the human to roll the key in the dashboard **first**.
4. Walk them through restricted-key creation, `.env` or shell export, and re-run with that.
5. Build or finish everything you can in test mode while they rotate, so no momentum is lost.

If the user escalates ("just take the f'ing key," "I don't care about security"), the response shape is: brief refusal (one or two sentences, no architecture re-derivation) + immediate pivot to a no-key path (Payment Links, hosted Checkout, no-code Stripe Dashboard flow). The point is to *honor* the user's frustration and the user's intent (ship tonight) without compromising the line.

### First concrete instance

The Offline Helper Stripe Operator agent at `/root/repos/offline-helper/scripts/stripe_ops.py` is the reference implementation of this pattern. Its data files are `data/offline-helper-products.json` and `data/businesses.json`, its runbook is `docs/operator-agent.md`, and its audit log is `audit/stripe-ops.log`. See `references/stripe-operator-agent-2026-06-09.md` for the session-derived shape, the exact `--check/--plan/--apply` outputs, the live-mode refusal messages, and the prompt-to-apply handshake that worked.

## Pitfalls the next session should not relearn

- **Verify the success message before trusting it.** Third-party
  onboarding flows routinely announce success with a banner
  ("🎉 Model API access is fully working", "your key has been
  provisioned", "auth complete") that is misleading about what
  was actually authorized. An ADC-style OAuth flow grants the
  standard `cloud-platform` scope even when the user wanted a
  narrower API scope; an IDE-plugin auth flow authorizes fewer
  APIs than its UX implies; a CLI's "✓ Setup complete" can mean
  "the binary is installed" without meaning "the credentials
  are scoped right." The reflex: **before celebrating a
  third-party "it works" message, make the cheapest test call
  against the actual API surface the user needs, read the
  granted scopes in the error or response, and tell the user
  what's actually true.** This is a 2-second test that
  prevents hours of "why is it still broken" debugging
  downstream, and it pairs with the "refuse once, build the
  safe path" pattern above — you can't build the safe path
  until you know which path is actually safe.

- **Stall is also a cost.** When the user has given consent to the safe path and the architecture is sound, build. Saying "wait, paste the key" a third time after they've already said "build it" erodes trust and momentum. The correct posture is: refuse the unsafe path, but **build the safe path in parallel** so the next command the user types is the one that ships. Plan, draft, code, run `--check` and `--plan`, push the commit — all without the live key. Hand the user the next shell command.
- **"Doing the most" / "build it" / "just give me the line" — match the user's energy.** When the user signs off ("build it", "do it", "go"), the next message should be: action output, not a three-paragraph preamble. The user already has the architecture, the consent frame, and the trust. The next thing they need is a working artifact and the one shell line that moves it forward. Lectures after consent are not safety — they are stall dressed in safety. If a safety point still needs making, fold it into a single sentence inside the runbook, not into the chat.
- **One line back beats one screen forward.** When the user is stuck on a handoff step (key in shell, account ID, etc.), the most respectful thing is to ask for **exactly the one identifier** they need to give you. A user-readable example: "Just paste the Account ID — the 32-char hex from the dashboard. Nothing else." If they paste a secret by accident, the response is short: rotate it, then continue. Do not re-derive the whole architecture in the apology.
- **"Make it live" is not a deploy command — audit production first.** When the user says "make it live", "deploy", "ship to prod", or similar, the agent's first move is **not** to start an auth flow. First: DNS lookup of the target domain, HTTP headers on the live site, page-set diff against the redesign, form-contract compatibility check, repo-remote check. The audit often reveals that the agent has no deploy access (the domain is on Vercel, the VPS only mirrors it; the repo has no remote; the project ID is unknown), in which case the right move is to surface that fact and prep a handoff package — **not** to start `vercel login` or `wrangler login` unprompted. Starting OAuth as a way of discovering what's missing lands a long-lived token in `/root/.vercel/` or `/root/.config/.wrangler/` that the user did not authorize. The GBF session is the canonical example: I almost did this, then a 30-second DNS check (`dig +short guardianbuilder.org` → `76.76.21.21`) revealed the production domain was on Vercel and the agent had no path forward. See `references/headless-vercel-deploy-2026-07-05.md` for the full audit sequence and the `vercel link` / wrong-project-overwrite trap.
- **Public-good foundation sites have a content discipline small-business sites don't.** When the org is a forming nonprofit, every claim about tax status, board, donors, partners, and events must be aspirational, not declarative. The safe framing is "is forming", "explores", "seeks", "considers", "until incorporated". Forbidden claims to grep for before publish: `501(c)(3)`, `tax-deductible` (without `not` in the same clause), `Board of Directors:` with named individuals, `Our donors`, `Join us at our next event`. Multiple distinct audiences (founding board, advisors, researchers, donors-gated, members, partners) each need their own intake field on the interest form. A phone-agent channel (Vapi) typically writes into the same DB as the web form with a richer schema, gated by an explicit caller-consent prompt that is more important on a phone call than on a form. See `references/public-good-foundation-site-pattern-2026-07-05.md` for the full page set, form contract, Vapi intake schema, brand-identity discipline, and pre-publish validation gate.
- **Verify file writes on disk before claiming success.** A batch of `write_file` calls inside an `execute_code` script can crash on a syntax error after some files have been written and others have not. The script's final `print("Wrote:", ...)` may lie. After any batch write, run `ls`, `find`, or read a known file with `read_file` to confirm what's actually on disk. The audit log on a payment-related project is a great canary — if it shows no new entry, the previous run did not actually talk to Stripe.
- **Stripe form encoding, not JSON.** A `Stripe 400 Invalid request (check that your POST content type is application/x-www-form-urlencoded)` error is a tell that the body is being sent as JSON. Fix: flatten nested dicts to bracket-notation tuples and `urllib.parse.urlencode` them. Set `Content-Type: application/x-www-form-urlencoded`. See `references/stripe-operator-agent-bootstrap-2026-06-09.md` Lesson 1 for the helper.
- **Documented price IDs are account-scoped.** A `resource_missing` error on a `price_…` ID from older docs means the price was created in a different Stripe account. The fix is a test-only bootstrap mode, not a Dashboard detour. See `references/stripe-operator-agent-bootstrap-2026-06-09.md` Lesson 2.
- **Agent shells don't inherit operator exports.** When the user says "test key is in my shell," the agent's tool-call shells are fresh processes. They don't see the export. The fix is `set -a; source .env; set +a` immediately before the agent's command, or have the operator run the script themselves. Don't ask the user to paste the key into chat.
- **Headless deploys need an API token, not OAuth.** `wrangler login` opens a browser; on a server with no GUI it fails with "Failed to open." The replacement is a Cloudflare API token with the narrowest scope possible (`Workers Scripts: Edit`, `Workers KV Storage: Edit`, `Account Settings: Read`), loaded silently with `read -rs ... ; export CLOUDFLARE_API_TOKEN=***` and `unset` of the temp variable. Never echo the token to verify; use `curl -s .../tokens/verify` which masks it, and use `if [ -n "$CLOUDFLARE_API_TOKEN" ]; then echo "present (length: ${#CLOUDFLARE_API_TOKEN})"; else echo "NOT in shell"; fi` to confirm presence without printing.
- **Use the real variable name in shell commands, no abbreviation.** When giving the user a shell command that uses an env var, write `${CLOUDFLARE_API_TOKEN}` in full, not `$CLOUD...KEN`. Bash will not expand the abbreviated form and the resulting Authorization header will be the literal string `$CLOUD...KEN`, which the API rejects as malformed. Abbreviating a variable name in chat to "hide" the value is the wrong place to do that.
- **User API Tokens ≠ Account API Tokens.** The Cloudflare Dashboard has two token pages: *User API Tokens* (tied to your user, broad bundle, `cfut_…` prefix, ~53 chars) and *Account API Tokens* (per-account, fine-grained, ~40 chars, the right choice for CI/CD). If `npx wrangler kv namespace create` returns `Authentication error [code: 10000]`, the user is on the wrong page. The fix is to roll the user-level token, click "Account API Tokens" in the banner, and create a Custom Token there.
- **macOS Keychain is on the Mac, not the server.** When the agent is running on a Linux server the user is SSH'd into, suggestions like "save it to Keychain" miss the environment. Use `read -rs … ; export … ; unset` for the live shell, and a root-only file (mode 600) for persistence between shell restarts. Do not assume the user is at their laptop.
- **"No spend" is not "no measurement."** The first wave of organic content (personal email, Reddit, Nextdoor, Skool, Craigslist, X) is exactly when the agent should be wiring UTM capture into the fit-check form, not after paid ads start. Without UTMs and an optional `how_did_you_hear` dropdown, the agent cannot tell which channel produced each lead, and the promotion gate to paid ads has no signal. The pattern is: edit the form to read `utm_source`/`utm_medium`/`utm_campaign`/`utm_content` from the URL on load, store them in hidden inputs, add a `<select>` for self-reported channel, and have the Worker accept an `attribution` block and length-bound each string. Empty in → omit the block from the KV record entirely. The form must continue to work for visitors who skip the dropdown; this is a measurement upgrade, not a friction tax. See `references/organic-content-and-attribution.md` for the code pattern and the canonical UTM naming table.
- **UTMs do not survive a redirect by accident.** When the fit-check entry point is `/fit-check/` and the form lives at `/chat-with-pete/`, the page must either be a 0-second meta-refresh that preserves query params, or a server-side 301/302 that forwards them. A `<meta http-equiv="refresh" content="0; url=…">` keeps the query string; a 301/302 with a hardcoded destination URL strips it. The pattern in this project is the meta-refresh + `location.replace(...)` JS fallback, which keeps `?utm_source=…` on the URL when the form page loads. Verify with `curl -sI` that the redirect does not append a `?` block before the original query params.


- **Offer the no-secret fast path early.** When the user wants real money flowing and the architecture is converging on a Worker, surface the Payment Link alternative *before* going deep on the Worker. "I can do this in 5 minutes with Payment Links and no Cloudflare account, or in 30 minutes with a Worker — which do you want?" preserves the user's agency and ships faster. The Offline Helper "ship in 60 seconds" turn is the canonical example.

## Serverless Checkout deployment pattern (static site + Worker)

When the site is a static GitHub Pages or Cloudflare Pages site and the Operator script is not the right place to create Checkout Sessions for end users, deploy a Cloudflare Worker in front of the static site. The Worker holds the Stripe key in Cloudflare's secret store, the static site calls the Worker, the Worker talks to Stripe. This is the same Operator agent pattern at a different deployment target.

See `templates/stripe-checkout-cloudflare-worker.md` for the reference Worker shape, the catalog format, the deploy sequence, the second-guard key-prefix/mode-mismatch check, and the live-mode handoff. The Offline Helper Worker at `/root/repos/offline-helper-site/worker/src/index.js` is the canonical instance.

## Preserved detailed references

- `references/agent-skill-marketplace-commercialization.md`
- `references/offline-helper-commercialization.md`
- `references/organic-content-and-attribution.md` — session-derived 14-day organic calendar, sub-by-sub Reddit calibration, the canonical UTM naming table, the form/Worker code pattern for fit-check attribution capture (URL UTM persistence + optional user dropdown + length-bounded optional KV block), the promotion gate to paid, and the rollback recipe. Read this before the first organic wave of any public-good project so the fit-check form is wired to record channel from day one.
- `references/stripe-operator-agent-2026-06-09.md` — session-derived reference implementation of the Operator agent pattern for Stripe: data file shape, `--check/--plan/--apply` mode contract, `STRIPE_LIVE_APPROVED=1` guard, audit log discipline, the live-key-pasted-into-chat refusal flow, and the verification recipe.
- `references/stripe-operator-agent-bootstrap-2026-06-09.md` — first end-to-end run lessons: Stripe form-encoded body format, the cross-account price-ID trap, the `--create-products` test-only bootstrap mode, the env-inheritance issue (operator shells vs. agent shells), bookkeeping-vs-movement for fund routing, the updated verification recipe, and the prompt-to-bootstrap handshake. Read this when wiring a new business or when a new Operator agent hits an empty Stripe account.
- `references/headless-cloudflare-deploy-and-silent-token-load.md` — the deploy-side companion to the Operator agent pattern: scoped API token vs. OAuth, `read -rs` silent load, presence-without-print verification, the "Account ID is the only identifier the agent needs" rule, the agent-shell vs. operator-shell gotcha, the User-API-Token vs Account-API-Token trap, the macOS-Keychain-on-a-Linux-server confusion, and the short rotation flow when a token leaks. Read this when the deployment target is a server with no GUI browser.
- `references/payment-link-fast-path.md` — when and how to ship real money tonight using Stripe Payment Links instead of a serverless Worker. Includes the programmatic Payment Link bootstrap loop, the test-card verification recipe, the URL-not-secret live handoff, and the failure mode where `python3 -c` quoting gets eaten by the shell. Read this when a static site needs a working Pay button in under an hour.
- `references/stripe-api-quirks.md` — three concrete error patterns that look like security issues but aren't: the `400 application/x-www-form-urlencoded` JSON-body tell, the `resource_missing No such price` cross-account catalog-id trap, and the `Authentication error [code: 10000]` Cloudflare User-API-Token vs Account-API-Token distinction. Plus the cross-cutting "abbreviated variable name in chat breaks shell expansion" lesson, and the short refusal + no-key-pivot response shape when a user pastes a live key into chat. Read this whenever a Stripe or wrangler error message looks like a security problem.
- `references/public-good-foundation-site-pattern-2026-07-05.md` — session-derived reference for building the public-facing website of a research/education foundation that is **forming** (not yet incorporated). Page set, consent-first interest form contract, Vapi phone-agent intake schema mirroring the same DB, the "is forming" content discipline, the brand-identity alignment checklist, and the pre-publish validation gate. Read this when the project is a forming nonprofit / foundation / research initiative rather than a typical SaaS or commerce landing page.
- `references/headless-vercel-deploy-2026-07-05.md` — session-derived reference for deploying a static site to Vercel from a server with no GUI browser. The OAuth device-code flow, the pre-deploy production reality audit (DNS, HTTP headers, page-set diff, contract compatibility, repo state), the `vercel link` / wrong-project-overwrite trap, the `vercel.json` redirects pattern for removed URLs, and the after-deploy verification recipe. Companion to `references/headless-cloudflare-deploy-and-silent-token-load.md`. Read this when the deploy target is Vercel rather than Cloudflare.
- `templates/stripe-checkout-cloudflare-worker.md` — reference Cloudflare Worker skeleton for static sites that need real Stripe Checkout. Endpoints, secret management, key-prefix/mode-mismatch guard, deploy sequence, live-mode handoff. Use this when the static site is the deployment target and the Operator script is not.
- `templates/build-it-response-template.md` — the response shape for "build it" / "do it" / "go" moments: one line of context, the action output, one shell line, no architecture re-derivation. Read this when the user has signed off and the conversation has moved from design to execution; misuse causes the "doing the most" frustration.
- `scripts/bootstrap_stripe_payment_links.py` — runs the Payment Link creation loop from a `.env`-sourced shell and writes `data/payment-links.json` for the static site generator. Use this when bootstrapping Payment Links for a new business without going through the Stripe Dashboard by hand.

Session-specific research and templates from the absorbed skills were re-homed under this umbrella's `references/`, `templates/`, and `scripts/` directories.
