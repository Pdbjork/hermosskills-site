---
name: stripe-go-live-workflow
description: >
  Operational workflow for taking a working test-mode Stripe
  integration to live AND for verifying an already-live integration
  end-to-end. Covers the Dashboard walkthrough, the "never see the
  live key" safety rule, the test-mode dry run, the live deploy
  ritual, and the Express/Node verify-the-pipes ritual. Load when a
  user says "go live," "flip to live," "launch payments," "we're
  ready for real cards," "real money now," "production time," "I
  need money," "verify the live Stripe pipes," "smoke test the
  checkout," or "show me money," or has either a working test-mode
  Stripe integration that needs to ship OR an already-live
  Express/Worker integration that needs end-to-end verification.
  Default assumption when a user says "go live" is wrong: the
  integration may already be live from a previous session. Always
  audit state first. Skip for API design questions, key-management
  theory, or pure code-review tasks — those are covered by
  `stripe-best-practices`.
---

# Stripe go-live workflow

A working test-mode Stripe integration is **not** a working
live-mode Stripe integration. The API calls are the same; the
operational sequence around them is different. This skill is the
playbook for the second half.

For the API design half (Checkout Sessions vs PaymentIntents,
dynamic payment methods, RAK permissions, webhook signature
verification, deprecation migrations), load
`stripe-best-practices`. This skill assumes the integration is
already designed correctly and needs to ship.

## The single safety rule

**The agent must never see, paste, log, or store the live Stripe
key.** The user types it directly into `wrangler secret put` (or
equivalent) from their own machine.

Concretely:
- The agent never accepts an `rk_live_…` or `sk_live_…` value in
  chat, even if the user offers.
- The agent's `.env`, shell history, log output, and tool
  transcripts must not contain live keys.
- If the user accidentally pastes one, the agent must (a) refuse
  to store it, (b) tell the user to roll the key immediately in
  the Stripe Dashboard, and (c) not echo the value back.

The Worker itself should have a runtime guard: refuse to start if
the key prefix does not match a configured live-mode flag
(Offline Helper's `keyMatchesLiveFlag` pattern is the model:
a live key with the flag off, or a test key with the flag on,
both refuse to start with a clear 412 error).

## Sequenced workflow

### Phase 0: The hidden blocker — assume nothing, audit first

The skill's default mental model is *greenfield go-live*: Worker not yet deployed, key not yet pushed, webhooks not yet wired. **That is often wrong.** A common case — and the one this skill must handle well — is *the integration was set live in a prior session, the user has come back months later, and the catalog and Operator-agent data file may have drifted apart while the Worker kept running*. The two failure modes:

- Worker is **already live** (`/api/health` returns `live_approved: true`), secrets are already pushed, the "go live" work was done before. In that case, the right action is **audit + verify**, not rebuild.
- Worker is **not yet live** (`live_approved: false` or flag missing entirely), the Operator-agent data file has *different* live `price_…` IDs than the Worker's `CATALOG` constant, the user is in the wrong Stripe mode, or some mix. In that case the work below is the real Phase 0.

A pre-flight audit is fast and saves the entire conversation from going down the wrong path. The recipe lives in `references/live-state-audit.md`; the short form is:

```bash
# 1. What mode is the Worker actually in?
curl -s --max-time 5 https://<worker-url>/api/health
# or use the browser tool if curl hangs (see pitfall below).
# Look for: "live_approved": true | false

# 2. What does the Worker think the catalog is? (compare to Operator data file)
grep -E "price_" /path/to/worker/src/index.js    # Worker's CATALOG
grep -E "price_" /path/to/data/products.json     # Operator data file
# These MUST agree on the live price_… IDs. If they don't, you have catalog
# drift and the user has to decide which one is canonical before pushing.

# 3. Are the policy pages live on the domain? (real URLs, not example.com)
for p in /terms/ /privacy/ /refund-policy/; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://${DOMAIN}${p}")
  echo "  https://${DOMAIN}${p} -> HTTP $code"  # all three must return 200
done
```

If the audit shows the Worker is already live and the catalog is consistent, skip Phase 1–5 and go straight to Phase 6 (real-card test charge) and Phase 7 (verify the charge lands in **Live mode** in the Dashboard). The session-level rule: **never re-litigate a deploy the user has already paid for; verify it.**

## Phase 0a: The hidden blocker — policy pages

Before the user can complete Stripe's Live-mode onboarding form,
they need three real URLs on their own domain:

- Terms of Service
- Privacy Policy
- Refund Policy

The Stripe form defaults these to `https://example.com/...`.
Saving those placeholders is technically allowed but creates real
legal exposure: every Checkout receipt and confirmation email
will link to a generic Stripe docs page, and there will be no
real privacy policy at all. Multiple US states (CA, VA, CO, CT,
UT, …) require a real, accessible privacy policy before a
business can collect payment data.

**Do this before the user starts the Dashboard walkthrough.**
Hand them three freshly-shipped URLs on their domain and have
them paste those into the Stripe form. See
`ai-visibility-for-small-sites/references/policy-page-templates.md`
for the templates and the ~90 minute build.

**Verify on the live site before the user pastes into Stripe:**

```bash
for p in /terms/ /privacy/ /refund-policy/; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "https://example.com${p}")
  echo "  https://example.com${p} -> HTTP $code"
done
# all three must return 200
```

## Phase 0.5: Pricing-table alternative to a custom Worker

Stripe has a no-code `stripe-pricing-table` component
(`<stripe-pricing-table pricing-table-id="prctbl_…"
publishable-key="pk_…">`) that lets the user list their three
products on a static page with a Stripe-hosted checkout, with
zero backend code. If the user pastes one of these snippets into
chat, they have already built the storefront in the Dashboard.

**Three options. Always ask which they want before continuing:**

| Option | Worker role | Trade-off |
|---|---|---|
| **(a) Pricing table only, kill the Worker** | None | Simplest. Loses fit-check metadata, Telegram-bot routing, KV fulfillment queue. |
| **(b) Pricing table for marketing, Worker for confirmed-fit buyers** | Captures `fit_check_id` + `setup_window` metadata, routes through to fulfillment queue | Preserves the funnel you designed. Slightly more code to maintain. |
| **(c) Pricing table for v1, retire the Worker, re-introduce custom checkout later** | None for now | Cheapest v1. Fastest to learn from real data. |

Option (b) is the right answer for most solo-founder service
businesses — pricing tables for cold traffic, custom checkout
for buyers the founder has already qualified.

If the user goes with (a) or (c), the Worker code can be
**archived, not deleted** — leave a one-line note in the repo
README explaining when to revive it.

## Phase 1: Confirm test mode is genuinely clean

Run a 4242 4242 4242 4242 test card through the full path.
Verify every step before flipping to live:

- [ ] Checkout Session creation returns a `url`.
- [ ] Browser redirect (303) lands on Stripe's hosted Checkout.
- [ ] Webhook endpoint receives `checkout.session.completed` and
      HMAC signature verification passes.
- [ ] Fulfillment record is written to the Worker datastore
      (KV, D1, Postgres, etc.).
- [ ] Success URL renders the right page on the user's domain.
- [ ] Cancel URL renders the right page on the user's domain.
- [ ] `/api/health` returns the expected catalog and `live_approved: false`.

If any step is broken in test, **do not flip live.** Fix the test
path first. The live path will have the same bugs plus a real
bank and a real customer.

### Phase 2: User-only steps in Stripe Dashboard

Five things only the human operator can do. Be explicit about
the division of labor:

| Step | Who | Notes |
|---|---|---|
| Switch toggle to Live mode | Human | Agent cannot do this. |
| Complete Branding + connect bank/payouts | Human | Required for live settlement. Bank verification is usually 1–2 business days. |
| Replicate products + prices in Live | Human | Prices have separate IDs in test vs live. The user copies the new `price_…` IDs and pastes them back to the agent. |
| Create Restricted API Key (Live) | Human | Name it after the integration (e.g. `offline-helper-payments-live`). Resources: minimum needed — usually `Checkout Sessions: write + read` and `Webhooks: read`. **Copy the `rk_live_…` value into the user's password manager. Never paste it in chat.** |
| Create webhook endpoint in Live | Human | Use the new Worker URL (or existing one if not renamed). Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`. Copy the new `whsec_…` signing secret. Same secret-isolation rule. |

### Phase 3: Agent's "bump on go-live" audit

While the user is in the Dashboard, audit the Worker for
go-live correctness:

- **Stripe API version.** Update `Stripe-Version` header to the
  current latest. Older versions may not support current payment
  method types, fraud signals, or Checkout features.
- **No `payment_method_types` in any API call.** Walk every
  Checkout Session / PaymentIntent / SetupIntent / Subscription
  creation site. Omit the parameter entirely; let Stripe pick
  dynamically. Only exception: Terminal
  (`payment_method_types: ['card_present']`).
- **No `automatic_payment_methods` on Checkout Sessions.**
  Stripe returns `400 parameter_unknown` for it. Dynamic
  payment methods are the default for Checkout and require no
  parameter. `automatic_payment_methods: { enabled: true }` is
  only valid on `PaymentIntents.create` / `SetupIntents.create`
  on API version 2023-08-16+. If you copy-pasted a PaymentIntent
  snippet into your Checkout flow, the same call will 400 in
  production. The fix is to delete the line; do not "set it
  to null" or "set it to false" — Stripe still rejects unknown
  keys. See `references/headless-cloudflare-deploy.md` for the
  Stripe request-log URL pattern that surfaces the exact
  failing parameter.
- **No deprecated `Charges` or `Sources` API calls.** Migrate to
  Checkout Sessions / PaymentIntents / Setup Intents.
- **Webhook signature verification present and correct.** HMAC
  with the raw request body, constant-time compare. Never trust
  the event payload without verifying.
- **All secrets in platform secret store, not in source code.**
  `wrangler secret put` for Cloudflare. Env vars set in the
  platform dashboard for Vercel / Netlify / Heroku. Never in
  `.env` committed to the repo, never hardcoded.
- **Catalog `price_…` IDs updated to live values.** Do not
  assume the test IDs will work in live (they will not). User
  pastes the live IDs; agent edits the Worker's `CATALOG`.

### Phase 4: User pushes the secrets

From the user's own machine (not the agent's VPS), the user
types:

```bash
# 1. Push the live RAK. User pastes rk_live_… directly.
read -rs RAK_LIVE
echo "$RAK_LIVE" | npx wrangler secret put STRIPE_SECRET_KEY
unset RAK_LIVE

# 2. Push the webhook signing secret.
read -rs WH_SECRET
echo "$WH_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
unset WH_SECRET
```

`read -rs` reads without echo; the variable is unset immediately
after, so it does not linger in shell history or environment.
Wrangler writes the value directly to Cloudflare's encrypted
secret store. The agent never sees the value.

### Phase 5: Provision resources + deploy

From the Worker directory (on the user's machine, with their
authenticated wrangler session, or via the agent's
`CLOUDFLARE_API_TOKEN` pattern if running on a headless VPS):

```bash
# 1. Provision the KV namespace if not already done.
npx wrangler kv namespace create OFFLINE_HELPER_QUEUE
# Paste the returned id into wrangler.toml [[kv_namespaces]] block.

# 2. Flip the live flag in wrangler.toml.
sed -i 's/STRIPE_LIVE_APPROVED = "0"/STRIPE_LIVE_APPROVED = "1"/' wrangler.toml

# 3. Deploy.
npx wrangler deploy
```

### Phase 6: Verify the live Worker is actually live

This is the gate. Local validation, screenshots, and "I ran
`wrangler deploy`" are not the same as "it's live."

- [ ] `curl -I https://<worker-url>/api/health` returns 200.
- [ ] `/api/health` JSON contains `"live_approved": true`.
- [ ] Run one **real-card** test charge at the smallest available
      amount. This proves end-to-end: key works, bank accepts,
      webhook fires, KV record writes, success page renders.
- [ ] Refund the test charge immediately if it was a non-real
      product.
- [ ] Confirm the charge appears in **Stripe Dashboard → Live
      mode → Payments**. (Not Test mode — a common mix-up.)
- [ ] **Fast check for which mode a Checkout Session opened
      in:** the URL's `cs_live_…` prefix (vs `cs_test_…`) and
      the browser tab title (set to the business name from
      Dashboard Branding on a live session, with no
      "Test mode" banner). This is faster than asking the user
      to re-check the Dashboard toggle.

### Phase 7: Then and only then, report "live."

Same discipline as `ai-visibility-for-small-sites`: "built and
ready to ship" is not the same as "live." The user will check.

## Pitfalls specific to go-live

- **Same Worker code, but different price IDs.** Test and live
  prices have separate `price_…` IDs. Updating CATALOG is
  mandatory.
- **The `<stripe-pricing-table>` `prctbl_…` ID is not a `price_…`
  ID.** The pricing-table ID is a *container* that groups
  multiple products; it works in the embedded `<stripe-pricing-table>`
  element on a static page but is **rejected** by the Worker's
  `line_items[].price` field. The Worker (and any custom Checkout
  integration) needs each product's individual `price_…` ID, not
  the container. If the user pastes a `prctbl_…` ID and the
  Worker is wired to it, every checkout returns 404 from Stripe.
  Same shape applies to CSV product imports, which return a
  `v2.commerce.product_catalog_import` object with
  `status: "awaiting_upload"` — useful internally to Stripe, not
  an artifact the integration consumes. Always ask for the
  individual `price_…` IDs when you need them, and verify the
  `price_…` IDs the integration uses by re-fetching the deployed
  bundle (`GET /accounts/<id>/workers/scripts/<name>` from the
  Cloudflare API returns the raw source) before declaring the
  catalog wired.
- **Webhook endpoint URL changes when the Worker redeploys.** If
  the Worker is renamed, moved, or its `account_id` changes,
  update the webhook endpoint URL in Dashboard or events will
  silently 404.
- **Old test webhook still firing.** Either delete the test
  webhook in Dashboard after the test dry run, or accept that
  you'll see duplicate test events during the transition.
- **Bank account not yet verified.** Stripe lets you create
  charges before bank verification, but payouts are held (usually
  1–2 business days for micro-deposits). Warn the user.
- **Tax settings.** If the user is selling in multiple states or
  countries, Stripe Tax + Registrations API is mandatory. For a
  US-only small service business, the default is usually fine,
  but flag it.
- **Statement descriptor.** Set in Branding settings. Appears on
  the customer's card statement. Default is the business name,
  shortened to 22 chars. Tell the user about it; do not silently
  leave the default.
- **Mixing test and live modes.** Mode toggle is in the top-left
  of Dashboard. Easy to miss. Always confirm "this is Live mode"
  before creating the RAK or webhook.
- **Policy pages still at `https://example.com/...`.** If the
  user has been sitting on the Dashboard form for more than a
  day, re-check that they have not saved the example.com
  placeholders. Pasting real `https://offlinehelpers.com/...`
  URLs into the form requires the pages to be live on the user's
  domain first. See Phase 0.
- **Catalog drift between Operator data file and Worker CATALOG.** The
  operator-agent pattern stores the live catalog in a JSON data file
  (e.g. `data/offline-helper-products.json`) and the Worker stores the
  same catalog as a JS `const CATALOG = { … }` in `src/index.js`. The
  two must agree on the live `price_…` IDs at all times. A common
  failure mode: a prior session updated the data file (after
  recreating a live price in the Dashboard) but the Worker was not
  redeployed, or vice versa. Symptom: `--check` and `--plan` print one
  set of price IDs, `curl /api/health` and the live Checkout Session
  use a different set. **The two must reconcile before any live test
  charge.** Run the static comparison (Phase 0 above) and ask the user
  which one is canonical. The fix is mechanical: edit the stale side
  to match, then redeploy. Do not let the discrepancy ride into a
  real-card test or the audit trail will not match what the customer
  was charged.
- **Confusing "ready to ship" with "live."** The same
  deployment-discipline failure as `ai-visibility-for-small-sites`:
  you update the Worker's `CATALOG`, commit locally, and tell the
  user "Worker updated." They ask "is it deployed and live?" and
  you realize nothing has been pushed, the Worker is not running
  the new code, and the live-mode test charge will fail. The fix
  is mechanical: **after every Worker edit during a go-live
  flow, run the full ship sequence — `git add`, `git commit`,
  `git push`, then `npx wrangler deploy` (or confirm the user
  runs it on their machine) — before reporting progress.** Local
  file edits and a clean `git status` are not the same as "the
  Worker is running this code in production." **The "committed
  and live?" question from the user is a cue to verify, not to
  re-claim progress.** Re-curl the live Worker URL, re-check
  the deployed `cat` against the local source, re-confirm the
  catalog price IDs are the live ones, *then* answer.
- **Stale `account_id` in `wrangler.toml`.** If the config was
  copied from a different Cloudflare account, or the account
  was re-created, `wrangler whoami` succeeds (uses the token's
  default account) but `wrangler deploy` errors with
  `account_id … does not match any of your authenticated
  accounts` and a 10000 auth code. Fix: run
  `npx wrangler whoami`, paste the Account ID into
  `wrangler.toml`'s `account_id = "…"` line, or remove the
  line entirely. Verify with `wrangler deploy --dry-run`
  before any `--live` push. See
  `references/headless-cloudflare-deploy.md` for the full
  headless-VPS pattern (`~/.cloudflare_token`, `deploy.sh`,
  `set-secrets.sh`).
- **CLOUDFLARE_API_TOKEN does not persist across shells.** Setting
  `export CLOUDFLARE_API_TOKEN=…` in one shell, then running
  `wrangler` from a different shell (e.g., a fresh terminal,
  a backgrounded process, a cron-style command), silently
  loses the variable. Either run all wrangler commands from
  the same shell, or stash the token in
  `~/.cloudflare_token` (chmod 600) and load it via a
  one-line `export` at the top of every deploy script. The
  template scripts in `templates/deploy.sh` and
  `templates/set-secrets.sh` already do this.
- **Strict `LIVE_APPROVED` gate blocks the test dry run.** A
  Worker that hard-rejects (HTTP 412) when the Stripe key
  prefix mismatches the `LIVE_APPROVED` flag is safer in
  theory but makes the test-mode dry run impossible: you
  cannot load a live `rk_live_…` key with the flag off to
  test the live catalog, and you cannot load a test key with
  the flag on to test the production path. The two-step
  dry run (test-key-then-swap) is the textbook answer but
  doubles the key-swap dance. The pragmatic middle ground:
  relax the gate to a `console.warn` for the
  `live_approved=0 + live key` combination (still
  production-safe because the flag still controls real
  charges), and keep the hard reject for the impossible
  `live_approved=1 + test key` combination. Document the
  relaxation in the code so a future maintainer does not
  reintroduce the strict gate and re-block testing.
- **Browser automation cannot reliably fill the Stripe
  Payment Element form during the dry run.** The form is
  React-controlled with hidden iframes for the card field.
  `browser_type` + `browser_click` of "Pay with card" works
  for card number / expiry / CVC, but JS-injected values
  for ZIP and phone number get cleared on the blur event
  the browser tools emit, leaving the form in the
  "incomplete" state. Spend at most 5 minutes on automation
  before handing the Checkout URL to the human user to
  complete in their own browser, or fall back to a real
  $0.50 charge with refund. See
  `references/stripe-checkout-automation.md` for the full
  failure modes.
- **Cloudflare's `workers.dev` subdomain doubles up if the
  script name is the only Worker in the account.** When
  `wrangler deploy` is the first deploy in an account, the
  account-level `workers.dev` subdomain gets auto-set to the
  script name. The published URL is then
  `https://<script-name>.<script-name>.workers.dev` (e.g.
  `offline-helper-payments.offline-helper-payments.workers.dev`).
  Three ways to handle it: accept the doubled URL as-is
  (it works, just long), set a shorter account subdomain via
  the API
  (`PUT /accounts/<id>/workers/subdomain` with
  `{"subdomain": "pdbjork"}`), or route a custom domain
  instead. Verify the chosen URL responds 200 from a
  *browser*, not just `curl` — some VPS curl builds fail TLS
  handshakes to doubled-prefix hostnames even when the
  browser gets through cleanly, which is a local cert / SNI
  issue, not a real outage. **Right reflex when `curl
  https://<doubled>.workers.dev/api/health` hangs from a
  VPS: open the URL in the browser tool (`browser_navigate`
  + `browser_snapshot`) and read the JSON body from the
  accessibility tree. A 30-second hang in curl is not a
  Worker problem; it is the doubled-prefix SNI issue and
  the Worker is almost certainly fine.**
- **`wrangler 4.99` (and later) prompts to install
  Cloudflare skills for detected AI agents.** The first
  time a user runs `npx wrangler deploy` on a new
  machine, wrangler scans for `gemini-cli`,
  `antigravity`, `hermes-agent` and offers to install
  Cloudflare's `cloudflare/workers` skill pack. This is
  interactive — a non-TTY context (backgrounded process,
  `nohup`, cron) will block. Either pre-install the
  skills via `npx skills add cloudflare/skills`, or run
  wrangler from a real TTY once to dismiss the prompt
  before any non-interactive deploys.
- **`read -rs` returns empty and you write a 1-byte token file.**
  If the paste to `read -rs CLOUDFLARE_API_TOKEN` captures only
  a trailing newline (common in some terminal emulators), the
  subsequent `echo > ~/.cloudflare_token` writes a single
  newline, `wc -c` prints `1`, and `wrangler` fails with a
  confusing auth error later. Always verify
  `wc -c ~/.cloudflare_token` shows 40+ (Cloudflare tokens
  are 40 chars) immediately after the `read -rs` block, before
  any `wrangler` command.
- **The agent's tool chain can rewrite `$(cat …)` in
  shell scripts.** If the script you intend to write
  contains a command-substitution token, the file on disk
  may end up with the `$()` stripped and a stray `)` left
  over, producing a bash syntax error. Symptom: `bash -n`
  the script → `syntax error near unexpected token ')'` on
  the line that looks correct in the source. The fix is
  mechanical: **use bash input redirection instead of
  command substitution** (`read -r VAR < file` plus a
  separate `export VAR`), which has no `$()` to filter.
  This is the right default for any token-loading helper
  script that may be authored or re-saved through an
  agent tool chain.
- **Workers that depend on a paid LLM will 500 the day
  the account runs out of quota.** A 429 `insufficient_quota`
  from OpenAI / Anthropic is **not** a key-push problem —
  it is a billing problem on the LLM account. Common with
  brand-new accounts whose free credits expired, or
  accounts with no payment method on file. The Stripe
  payment path is independent of the LLM billing path, so
  the rest of the live integration (Checkout Session
  creation, webhook → KV, fulfillment) can be fully live
  while the chat funnel is dead. **Build the form-fallback
  before the chat.** A 5-field static form that POSTs to
  the same `complete` endpoint preserves the
  `fit_check_id` round-trip and the Stripe metadata chain
  with no LLM call. See
  `references/ai-fit-check-chat.md` for the full pattern
  and the "form is load-bearing, chat is polish"
  framing.
- **The "two-machine problem" — assuming the user means
  the wrong shell.** When the project lives on both the
  user's laptop and the agent's VPS (or two agents, or a
  CI runner and a dev box), and the user says "you do
  it" or "push the key" or "deploy it," the agent has to
  pick a machine. Wrong default: assume the user's
  laptop. Right default: assume the machine the agent
  has been working on, which is usually the VPS, and
  **state the machine out loud and confirm before
  running.** The cost of getting this wrong is a secret
  bound to the wrong Worker, a 500 the user can't
  diagnose, and 10 minutes of "I pushed it but it's not
  working" debugging. The reflex is the same as the
  "committed and live?" pitfall: verify, don't assume.

- **"I need money" / "verify the live Stripe pipes" is
  NOT a go-live request.** When the user says that, the
  default action is *not* to rebuild or flip modes — it's
  to prove the existing live plumbing works
  end-to-end. This is the **Express-served verify-the-
  pipes ritual** (or Phase 6 + Phase 7 of this skill for
  Workers): start the existing server, hit
  `/api/health`, fire real `cs_live_…` checkout
  sessions, cross-verify each with Stripe REST
  (`livemode=True`), expire any orphan sessions left by
  prior runs, kill the servers. Six steps, ~3 minutes.
  See `references/express-live-smoke-test.md` for the
  full ritual and `scripts/live-smoke-test.sh` for the
  one-shot executable. The Worker equivalent is
  `wrangler tail` + a real-card charge. **Always run
  the orphan-cleanup loop at the end.** Smoke sessions
  accumulate in the Stripe Dashboard's open-sessions
  view across runs that never cleaned up; a single
  unrun cleanup over months can produce 10+ orphan
  sessions that look like abandoned carts and skew the
  "recent activity" view. Treating the smoke test as
  just "fire some sessions" without the cleanup is the
  same shape of failure as treating "go live" as just
  "flip the toggle."

- **The "live" may already be live — audit before you
  build.** When the user says "ship Offline Helper
  payments live" or "Phase 1: Stripe live," the
  default assumption is "build it from test mode to
  live mode." That is the *wrong* default. The
  previous session (or a prior workflow) may have
  already pushed the live key, set
  `STRIPE_LIVE_APPROVED = "1"`, and deployed. The
  very first thing the agent should do is **verify the
  current state** before any "go live" planning:

  1. `curl -sS https://<worker-url>/api/health` from a
     browser (VPS curl often fails TLS on doubled
     `workers.dev` subdomains) and read the
     `live_approved` field. If it's `true`, the
     Worker is already in live mode.
  2. Read the Worker's `wrangler.toml` to confirm
     `STRIPE_LIVE_APPROVED` and the
     `[[kv_namespaces]]` binding.
  3. Read the Worker's `CATALOG` and the operator
     agent's `data/*.json` and **reconcile price
     IDs**. A divergence between the two is the
     canonical "deployed but stale" tell. The
     Worker is what buyers see; the data file is
     what the operator script will reach for if
     you run `--apply`. They must match.
  4. Confirm policy pages are 200 on the user's
     domain (`/terms/`, `/privacy/`,
     `/refund-policy/`).
  5. Confirm the live webhook endpoint is wired in
     the Dashboard (ask the user — this is
     user-only).

  Only then should you and the user talk about
what's *actually* left: a real-card end-to-end
test, a refund, the catalog reconciliation, or —
if everything checks out — "Phase 1 is done, you
are live, here is your $0.50 refund receipt." The
build-from-scratch plan is the *contingency*, not
the default. Defaulting to it is the same
"committed and live?" reflex in reverse: you
assume work that doesn't need doing and create
work for the user that may not be necessary.

- **"The doc says X" is not "the live site does X."
  Generalize the audit reflex beyond deploy state.**
  The previous pitfall covers Worker/server deploy
  state. The closer pattern that bites even when
  the integration is greenfield: a brief, design
  doc, yesterday's YOLO summary, or a prior
  session's hand-off states a fact about the *product
  surface* (not the deploy state), and the agent
  treats that fact as ground truth. Examples
  observed in 2026-07-05 Offline Helper work:

  - "The landing page has no payments" — true on
    the *intent* layer, false on the *deploy* layer:
    the Worker with full Stripe Catalog existed in
    the repo but had never been deployed; the
    confirmed-fit-payment page referenced a
    doubled-subdomain Worker URL that would 404
    even after deploy. The doc was describing the
    intent, not the deployed reality.
  - A new navigation link on `index.html` to a
    page that exists locally but isn't on origin's
    main yet → 404 on the live site. Local repo
    state ≠ GitHub Pages state.
  - "The Capture endpoint returns 500 with body
    X" stated in a brief → the live endpoint
    returns 200 with body Y because a different
    upstream worker has been swapped in. Briefs
    are snapshots of intent, not live state.

  **Right reflex before designing against any doc
  premise about product behavior:** for each
  stated fact, run a 30-second live probe and cite
  the response in your plan. The minimum probe
  set for "Stripe on landing" / "checkout on
  marketing page" requests is:

  - Worker URL or server port reachable?
    `curl -s --max-time 5 <url>/api/health` from
    the VPS, or `browser_navigate` +
    `browser_snapshot` to read JSON. Read both
    `live_approved` *and* the catalog id list.
  - Hardcoded Stripe URLs in the live HTML
    actually point to a deployed Worker?
    `curl -s https://<domain>/<page>.html |
    grep -Eo 'https?://[^\"'"'"' ]*' | grep -i
    'stripe\|workers.dev'`. (A doubled-subdomain
    URL is a deploy signal even if curl returns
    200; the URL is the wrong URL.)
  - Pages referenced by nav actually 200?
    `for p in /nav-page-a /nav-page-b; do curl
    -s -o /dev/null -w "%{http_code} $p\n"
    https://<domain>$p; done`.
  - Endpoints cited in the brief — `/api/stats`,
    `/api/interest`, etc. — match the endpoints
    the live page actually calls? `grep -Eo
    'api/[a-z_-]+' index.html` and compare.

  **The docs describe what should be true; the
  live site describes what is.** When they
  disagree, the work is to converge them — not to
  assume the doc is right. "I shipped the deploy
  the brief described" against a doc that didn't
  match live state creates a parallel checkout
  path next to the existing-but-broken one.
  Probing first costs 30–120 seconds; rebuilding
  on a wrong premise costs an entire session.

## Signals that should trigger this skill

- **Greenfield go-live:** "Go live," "launch payments," "flip to
  live," "we're ready for real cards," "real money now,"
  "production time," or similar.
- **Already-live verification:** "I need money," "verify the live
  Stripe pipes," "smoke test the checkout," "show me money," or
  any request to prove an existing Express/Worker Stripe
  integration is healthy end-to-end. Use the Express ritual in
  `references/express-live-smoke-test.md` (or the Worker Phase 6
  + Phase 7 path) for this branch.
- A working test-mode Stripe integration that needs to ship.
- Questions about RAKs, restricted API keys, `rk_live_`, the
  difference between test and live prices, or webhook signature
  verification in production.

## Signals that should NOT trigger this skill

- "How do I use Checkout vs PaymentIntents?" → `stripe-best-practices`
- "Is my Worker code PCI-compliant?" → `stripe-best-practices`
- "Should I use Subscriptions or one-time charges?" → `stripe-best-practices`
- Pure code review with no production-deploy intent.

## Related skills

- `stripe-best-practices` — API design, RAK permissions, dynamic
  payment methods, webhook signature verification, deprecation
  migrations. Load first for any design question; this skill
  assumes the design is correct.
- `stripe-live-rollout` has been **consolidated into this
  skill.** Its unique material — the AI fit-check chat pattern
  and the `cs_live_…` browser-title trick — now lives in
  `references/ai-fit-check-chat.md` and the "Live-mode
  verification" section below, respectively.
- `ai-visibility-for-small-sites` — closing the "AI says nothing
  about you" gap. Companion workstream that often ships alongside
  go-live: the JSON-LD on the live site should reflect the
  live-mode Stripe catalog, not the test-mode one.
- `wrangler` and `workers-best-practices` — for the Cloudflare
  Worker deploy mechanics.
- `github-pages-product-landing` — for the static-site side of
  the integration (success/cancel pages, FAQ, schema.org).

## Support files

- `templates/deploy.sh` — `wrangler deploy` wrapper that reads
  `CLOUDFLARE_API_TOKEN` from `~/.cloudflare_token` and defaults
  to dry-run (use `--live` to actually push).
- `templates/set-secrets.sh` — `wrangler secret put` wrapper for
  `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` with hidden
  prompts. No values written to disk.
- `references/headless-cloudflare-deploy.md` — full headless-VPS
  pattern, the `account_id` mismatch pitfall, the token-persistence
  pitfall, and the empty-`read -rs` / 1-byte token file gotcha.
- `references/live-state-audit.md` — the 60-second pre-flight audit:
  Worker mode (live vs test), catalog drift between Operator data
  file and Worker CATALOG, policy pages, Stripe-mode sanity, and
  what the audit does *not* cover (webhook URL, bank verification,
  statement descriptor). Read this before the "go live" request to
  route greenfield-vs-already-live correctly.
- `references/page-state-probe.md` — the probe playbook for
  verifying any design-doc premise about the *product surface*
  (live HTML, hardcoded URLs, nav links, endpoint citations)
  before designing against it. Companion to
  `live-state-audit.md`; together they cover deploy-state and
  page-state. Read before any "Stripe on landing" / "checkout on
  marketing page" request where a brief, design doc, or yesterday's
  YOLO summary has stated a fact about user-visible behavior.
- `references/stripe-checkout-automation.md` — what works and
  what doesn't when the agent uses `browser_*` tools to fill the
  Stripe Payment Element during the test dry run. Read this
  before spending time on browser-form automation.
- `references/ai-fit-check-chat.md` — the AI fit-check chat
  pattern (gpt-4o-mini → `[READY_TO_SCORE]` token → scoring
  function → `fit_check_id` round-trip into Stripe Checkout
  metadata), the per-service `set-openai-key.sh` sibling
  pattern, the `$(cat ...)` tool-filter pitfall, the
  429-insufficient-quota failure mode with the
  static-form fallback, the "which machine am I on?"
  reflex for two-machine sessions, and the
  "Failed to fetch" CORS + opaque-redirect trap on the
  buyer's checkout click (the `Response.redirect()` gotcha
  + the `fetch(..., { redirect: 'manual' })` gotcha, with
  the native-form-submit fix).
- `references/user-communication-cadence.md` — the
  one-word-prompt-during-known-flow handling, the
  hybrid-storefront (pricing table + Worker) framing,
  the "placeholder values are a STOP signal" rule, and
  the `cs_live_…` browser-title live-mode verification
  trick. Consolidated from the archived `stripe-live-rollout`
  skill.
- `references/express-live-smoke-test.md` — the
  **Express/Node verify-the-pipes ritual** for when the
  integration is already live (env file at
  `/etc/<product>.env`, Express `server.mjs`) and the user
  says "show me money" or "verify the live Stripe pipes"
  rather than "go live." Six steps: find env + port,
  background-start server with `set -a; . /etc/...env;
  set +a`, hit `/api/health`, fire live-mode checkout
  sessions via curl, cross-verify each with Stripe REST
  (`livemode=True`), expire every orphan session on the
  account, kill the servers. Includes the test-key-
  masquerading-as-live-key pitfall, the localhost-only
  binding convention on this VPS, and the "always expire
  orphans — they accumulate" housekeeping rule. The
  Cloudflare Worker equivalent is Phase 6 + Phase 7 of
  the main SKILL.md.
- `scripts/live-smoke-test.sh` — one-shot executable that
  runs the six-step ritual for a list of products in one
  invocation. Read each `/etc/<product>.env`, start each
  server on its port, fire one session per price tier,
  cross-verify, expire orphans across all touched
  accounts, kill all servers, print a green/red summary.
  Usage: `live-smoke-test.sh chromebloom 3017 cart
  seed-red-anthurium-planter hermosskills 3019 plan sponsor
  hermosskills 3019 plan commission`.
