---
name: ai-visibility-for-small-sites
description: >
  Make a small business website (solo founder, local service, niche SaaS,
  personal brand) discoverable and citable by AI search — ChatGPT,
  Perplexity, Claude, Gemini, Google AI Overviews. Covers the schema.org
  JSON-LD scaffolding (Organization, LocalBusiness, Service, Offer,
  FAQPage), the "answer-ready content for buyer prompts" plan, the
  citation/reputation gap closer, and the validate-before-ship discipline
  (always re-parse every JSON-LD block you write). Load when the user
  asks about AI visibility, GEO (generative engine optimization), being
  cited by ChatGPT, schema.org / structured data, FAQ rich snippets, or
  wants to close the "AI says nothing about my business" gap. Skip for
  large enterprise SEO (technical sitemaps, hreflang, log-file analysis)
  — this is the small-team, no-Specialist playbook.
---

# AI visibility for small sites

A solo founder or small team who wants ChatGPT / Perplexity / Claude /
Google AI Overviews to actually mention their business by name when
buyers ask relevant questions. The lever is structured data (JSON-LD
the crawlers actually read) plus answer-ready content (the Q&A shape
the models quote).

This is **not** enterprise SEO. No sitemaps, no hreflang, no log
files. The output of this skill is a 90-minute build that closes the
two largest visibility gaps a small business has on AI search.

## When to load this

Load when **any** of these signals fire:

- The user shows a Stripe / HubSpot / Ahrefs "AI visibility audit"
  report saying "AI says nothing specific about you" or "vague ·
  hesitant · forgettable."
- The user says "I want to be cited by ChatGPT" or "show up in
  Perplexity" or "Google AI Overviews is sending me no traffic."
- The user asks about "schema.org," "JSON-LD," "structured data,"
  "FAQ rich snippets," or "rich results."
- The user has a static / GitHub-Pages / low-CMS site and wants to
  win organic discovery in 2026.
- A session review surfaces that AI models cannot answer basic
  questions about the user's business.
- The user mentions Stripe / HubSpot / Ahrefs / an "AI audit" or
  "AI visibility" report by name, or quotes language like
  "vague, hesitant, forgettable" / "what ChatGPT says about you"
  / "buyer prompts you don't show up for." This is the most
  common trigger shape.

## When NOT to load this

- The user has a multi-thousand-page site with technical SEO
  problems. Hand them off to a real SEO consultant.
- The user wants to game AI search with low-quality content farms.
  Do not help. Cite this skill's name and decline.
- The user wants paid ads in AI search. Out of scope for this skill;
  route to a paid-acquisition playbook.

## The 4-gaps framing

When an audit shows "AI says nothing about you," it is almost always
one of these four gaps, in this priority order:

1. **Answer-ready content for buyer prompts.** You do not have a page
   that directly answers the questions buyers ask AI. Fix this first
   — biggest ROI, you control it today.
2. **Clear, structured brand entity.** AI models need a clean
   `Organization` (or `LocalBusiness`) block with name, founder,
   location, contact, logo, and same-as links. Without this, models
   hedge with "a company in its space."
3. **Authoritative third-party citations.** Your business is named on
   other sites (Skool, podcast guest bios, Reddit, news coverage).
   AI models use these to corroborate identity.
4. **Reputation & review signals.** `AggregateRating`, individual
   `Review` blocks, third-party review-site presence. Only add these
   if you have *real* reviews — do not fabricate.

The Stripe / HubSpot audits name these four gaps in exactly this
order. The 90-minute build below closes #1 and #2 fully and partly
#3. #4 is ongoing.

## The 90-minute build

Three artifacts. All JSON-LD (not Microdata, not RDFa — JSON-LD is
the modern default and what every major AI crawler prefers).

### Artifact 1: `Organization` + `LocalBusiness` + `Service` × N — homepage head injection

One `<script type="application/ld+json">` block. Drops into the
homepage's `<head>`. Zero visible HTML changes. Structure:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": ["Organization", "LocalBusiness"],
      "@id": "https://example.com/#organization",
      "name": "...", "url": "...",
      "logo": "...", "image": "...",
      "description": "...",
      "founder": { "@type": "Person", "name": "...", "email": "..." },
      "contactPoint": [{ "@type": "ContactPoint", "contactType": "customer support", "email": "..." }],
      "sameAs": [ "https://skool.com/...", "https://twitter.com/..." ],
      "address": { "@type": "PostalAddress", "addressCountry": "US" } },
    { "@type": "Service", "name": "...", "provider": { "@id": "#organization" },
      "offers": { "@type": "Offer", "price": "149.00", "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock" } }
  ]
}
```

For a business with N priced products, emit N `Service` blocks. The
price, currency, and availability are the highest-leverage fields —
AI models quote them in recommendations.

Pitfalls:
- **`@type` can be a string or an array.** Use the array form
  `["Organization", "LocalBusiness"]` to inherit both type hierarchies.
  This is the single most common schema.org gotcha.
- **Provider must be a reference, not a copy.** Use `"provider":
  { "@id": "#organization" }` to point to the entity in `@graph`.
  Copying the data instead of referencing breaks the entity in
  crawlers' knowledge graphs.
- **Do not fabricate reviews / ratings.** If you have none, omit
  `aggregateRating` entirely. Lying here is a policy violation and
  erodes trust in everything else on the page.
- **Currency precision.** `"price": "149.00"` not `"149"`. The
  decimal is required by Google's Rich Results Test even if it's
  zero.

### Artifact 2: A new `/faq/` page with `FAQPage` JSON-LD

The single biggest AI-citation win. Direct Q&A for every buyer
prompt surfaced in the audit. Visible HTML uses `<details>` /
`<summary>` for collapsibility (good UX, good a11y); the same Q&A
appears in the JSON-LD `mainEntity` array.

Shape:
```json
{ "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question",
      "name": "How can I...?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ] }
```

Target 7–12 questions per page. Use the buyer's *exact phrasing*
from the audit as the `name` field — models match on those tokens.

For the visible HTML, render the same Q&A in `<details>` blocks
so the page works for sighted users too. A page that is JSON-LD
without visible content looks like a link scheme to Google.

### Artifact 3: A short `README.md` with validate + deploy steps

The user is going to deploy this. They need: how to validate (URLs
to Google Rich Results Test and Schema Markup Validator), how to
paste (which file, which line), how to deploy (git commands), how to
know it worked (Search Console FAQ detection, expected timing
3–7 days for Google, longer for AI crawlers).

## The "answer-ready content" plan (gap #1)

The schema.org scaffolding without matching content is a hollow
shell. The content plan is the other half of gap #1:

For each of the 7 buyer prompts the audit surfaced, the FAQ page
must:
- Use the prompt's exact wording (or close paraphrase) as a `<h2>`
  or `<details>` summary.
- Answer in **plain, specific prose** — 80–200 words per answer. No
  marketing fluff, no "we are the best," no unbacked superlatives.
  AI models downweight promotional language in citations.
- Reference *concrete facts* the user already said in conversation:
  prices, year founded, founder name, device compatibility,
  proof points, customer profile. Specifics are what make the
  answer quotable.
- Include 1–2 honest alternatives for context ("you have three
  paths, here is option 2 and 3"). This makes the answer feel
  editorial rather than promotional, which models reward.

The "older adult memoir writer" prompt from the Offline Helper
audit is a textbook example: a 68-year-old first-time memoir
writer who drafts in 45-minute sessions using the AI as a quiet,
non-judgmental first reader. That sentence is quotable because it
is specific, true, and was given by the user unprompted. Use that
kind of material.

## Citations to start chasing (gap #3)

After the build ships, the highest-leverage citations for a small
service business are:

- **Skool / Circle / Mighty Networks community page** with the
  founder's name and a real description.
- **Guest podcast episodes** (founders and operators talking about
  their niche). Add as `sameAs` on the Organization block.
- **Hacker News / Reddit / Indie Hackers mentions** — public,
  crawled, not removable.
- **A short founder bio page on a personal site** with `sameAs`
  links to LinkedIn, GitHub, etc.

You will not turn these around in a week. But adding them as
`sameAs` on the Organization block is free, takes 5 minutes per
citation, and compounds over months.

## Validate before ship — non-negotiable

The single biggest pitfall when writing JSON-LD by hand: shipping
broken syntax. This session's FAQ page shipped with a missing
`"acceptedAnswer": {` wrapper on a Q, only caught by re-parsing
with a JSON loader. The fix is mechanical and mandatory:

```python
import json, re
text = open("path/to/page.html").read()
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',
                        text, re.DOTALL):
    json.loads(block)  # raises on syntax error
    print("OK")
```

**Always run this on every HTML file you write or modify that
contains a JSON-LD block. Before declaring done. Every time.**

Also validate against Google's expected-field rules:
- `Organization` requires: `@type`, `name`, `url`, `logo`.
- `Service` requires: `@type`, `name`, `provider`, `offers`.
- `FAQPage` requires: `@type`, `mainEntity` (non-empty array).
- `Question` requires: `@type`, `name`, `acceptedAnswer`.
- `Answer` requires: `@type`, `text`.
- `Offer` requires: `@type`, `price`, `priceCurrency`.

`https://search.google.com/test/rich-results` catches missing
fields; `https://validator.schema.org/` catches syntax.

## Match the design system

The FAQ page should not look like a JSON-LD test stub. Match the
homepage's CSS variables (colors, font, spacing, radius) so the
new page looks native. Read the homepage `<style>` block first
and copy the same `:root` custom properties into the new page.

Spending 20 minutes on visual match is not optional polish — it is
the difference between "real business" and "SEO experiment." Google
and AI models both downweight pages that look auto-generated.

## Pitfalls

- **Shipping JSON-LD without re-parsing it.** Caught me in this
  session. Always validate before declaring done.
- **"Done" ≠ deployed.** This is the single most embarrassing
  failure mode in this skill: you build the FAQ page, validate
  the JSON-LD, screenshot it locally, write a great README, and
  report "deliverable shipped." The user then asks
  *"Everything is committed to GitHub and live on the site?"* and
  you discover the files are sitting untracked in the local repo
  and the live URL still 404s. The fix is mechanical: **after
  every AI-visibility build, run the full ship sequence —
  `git add`, `git commit`, `git push`, then `curl -I` the live
  URL and grep the served HTML for `application/ld+json` before
  you tell the user it's done.** Local validation, screenshot
  proof, and "I wrote a README" are not the same as "it's live."
  See "Deployment discipline" below.
- **Forgetting the visible HTML behind the JSON-LD.** A page that
  is JSON-LD-only looks like a link scheme. Always have a
  human-readable version of the same Q&A.
- **Fabricating `aggregateRating` or `Review` data.** Policy
  violation. Omit entirely if you have no real reviews.
- **Promotional language in FAQ answers.** Models downweight
  "we are the leading provider" type prose. Specific facts, named
  proof points, and editorial alternatives are what get cited.
- **Updating the catalog without updating the JSON-LD `Offer`
  block.** Pricing change = edit two places. Document both in
  the README so a future maintainer does not break one.
- **Confusing the Stripe pricing-table ID with a price ID.**
  A `<stripe-pricing-table pricing-table-id="prctbl_…">` is
  a *container* that holds multiple products; the `prctbl_…`
  ID is not usable in `line_items[].price`. The Worker (or
  any custom Checkout integration) needs each product's
  individual `price_…` ID, not the container. Same shape
  applies to CSV product imports, which return a
  `v2.commerce.product_catalog_import` object with a
  `status: "awaiting_upload"` and an `upload_url` — useful
  internally to Stripe, not an artifact your integration
  consumes. Always ask for the individual `price_…` IDs
  when you need them, and verify the `price_…` IDs the
  integration uses by re-fetching the deployed bundle
  (`GET /accounts/<id>/workers/scripts/<name>` from the
  Cloudflare API returns the raw source) before declaring
  the catalog wired.
- **Setting `price: "149"` (no decimal).** The decimal is
  technically required by the schema, even when zero. Always
  `"149.00"`.
- **Forgetting `availability: "https://schema.org/InStock"`.**
  AI models surface availability in recommendations. Omitting it
  leaves the field ambiguous and downranks the listing.
- **Treating AI visibility as one-and-done.** It is not. Models
  re-crawl on a lag of days to weeks. Re-validate monthly. Add
  citations as you earn them. Update the FAQ as buyers ask new
  questions.

## Deployment discipline

The build is not the ship. The full ship sequence for any
AI-visibility deliverable:

1. **Local validation** — `python scripts/validate-json-ld.py path/to/page.html`
   reports 0 issues.
2. **Visual smoke test** — `python3 -m http.server` locally, open the
   page in the browser, confirm the visible HTML matches the
   JSON-LD content (no `<details>` mismatches, no broken
   design-system inheritance).
3. **Git** — `git add`, `git commit -m "<message that mentions AI
   visibility>"`, `git push origin <branch>`. Confirm the push
   landed: `git log --oneline origin/<branch> -1`.
4. **Wait for deploy** — GitHub Pages typically redeploys in
   30–90 seconds. Poll with `curl -I <live-url>` until the
   `Last-Modified` or `ETag` advances.
5. **Verify the live HTML** — `curl -s <live-url> | grep -c
   'application/ld+json'` should match the count of JSON-LD
   blocks you wrote. `curl -s <live-url> | grep -oE '"@type":
   "[^"]+"' | sort -u` should list every type you wrote.
6. **Only then** say "live." Anything before step 6 is "built and
   ready to ship" — not the same claim.

If the user has to come back and ask "is it actually live?," you
broke this discipline. Apologize briefly, finish the ship, and
re-check your mental model of what "done" means in this skill.

## Linked files

- `references/json-ld-snippets.md` — copy-paste-ready JSON-LD
  blocks for the most common small-business shapes (solo founder
  service, multi-product shop, local business, B2B SaaS).
- `references/policy-page-templates.md` — the three pages
  (Terms of Service, Privacy Policy, Refund Policy) that Stripe,
  Google Play, Apple App Store, and most payment processors
  require before they will let a small business charge cards. AI
  crawlers also use them as authoritative corpus. Includes the
  "short version" callout pattern and the "not legal advice"
  footer language.
- `templates/faq-page.html` — full `/faq/index.html` skeleton
  matching the Offline Helper warm-paper design, ready to adapt
  to any brand by swapping the `:root` custom properties and
  the `mainEntity` Q&A list.
- `scripts/validate-json-ld.py` — the re-parse loop, plus a
  required-field check, runnable as a single command.

## Policy pages — a hidden AI-visibility + payment-prerequisite gap

The same Stripe / HubSpot / Ahrefs audits that flag "AI says
nothing about you" almost always also flag (or worse, *don't*
flag and then block go-live) a separate gap: **no Terms, no
Privacy, no Refund policy at real URLs on the business's own
domain.** Two consequences:

1. **Stripe will block go-live.** The Live-mode onboarding form
   has a "Business settings" step with three URL fields that
   default to `https://example.com/...`. Saving those placeholders
   is technically allowed but produces a real legal exposure:
   every receipt and Checkout page will link to Stripe's generic
   docs at `example.com/terms` and a privacy policy that does not
   exist. Multiple US states (CA, VA, CO, CT, UT, …) require a
   real, accessible privacy policy before a business can collect
   payment data. Fix: ship the three pages on the business
   domain *before* pasting the URLs into Stripe.
2. **AI crawlers use the policies as authoritative corpus.** When
   ChatGPT or Perplexity is asked "is this business legit / what
   is their refund policy," the model often quotes the business's
   own policy page verbatim. Missing policies are a real
   citation loss, not just a legal risk.

The three pages take ~90 minutes to write. Each is plain English,
US-law-aware, and matches the rest of the site's design system.
See `references/policy-page-templates.md` for the templates and
the "short version / not legal advice" callout pattern that
lands well with both regulators and AI models.

## When you only have 90 minutes — the quick-build order

The full playbook above is comprehensive. When the user is in
a hurry (a launch tomorrow, a press cycle, a Stripe audit they
just discovered) and only has ~90 minutes, ship **only the two
code-only gaps** in this order and defer the rest:

1. **Identify 5–7 ready-to-buy buyer prompts from the audit.**
   Group by intent (research vs comparison vs ready-to-buy) and
   prioritize the ready-to-buy ones first — those are the
   prompts where a citation directly converts.
2. **Write the answers in human prose first.** 50–150 words
   each, plain-spoken, mentioning the product by name, linking
   to the relevant product/fit-check page. AI models quote these
   answers verbatim; bad prose = bad citations.
3. **Wrap them in `FAQPage` JSON-LD.** New `/faq/` page. Test
   that every block parses with `json.loads` (no trailing
   commas, no single quotes) before commit.
4. **Build the `Organization` + `Service` blocks for the
   homepage.** One `<script type="application/ld+json">` block,
   multiple entities combined via `@graph`.
5. **Validate, ship, verify live.** Schema Markup Validator
   + Google Rich Results Test → `git add`/`commit`/`push` →
   `curl -I` the live URL → grep the served HTML for
   `application/ld+json` → only then report "live."

Gaps 3 (citations) and 4 (reputation) take months of work and
are not in scope for the quick build. The user will need a
follow-up to chase Skool/podcast/Reddit mentions and to start
collecting real reviews. The `ai-visibility-build` skill was
the previous quick-build-only skill; it has been consolidated
into this one — the full playbook above plus the prioritized
quick-build order here is the new canonical home.

## Schema.org type selection — quick reference

| Site shape | Types to emit |
|---|---|
| Single-product / single-service | `Organization` + `Service` (with `Offer`) + `FAQPage` |
| Multi-product catalog with prices | `Organization` + 1× `Service` per product (each with its own `Offer`) + `FAQPage` |
| E-commerce with multiple SKUs | `Organization` + multiple `Product` (each with `Offer`) — use `Product`, not `Service`, when the customer is buying a thing, not a session |
| Subscription product | `Service` + `Offer` with `priceSpecification: { @type: UnitPriceSpecification, unitText: "MONTH" }` |
| Free trial + paid | Two `Offer` blocks (one with `price: "0"`, one with the paid price) OR a single `Offer` with `priceSpecification` and a `subscription_data.trial_period_days` reference in the description |
