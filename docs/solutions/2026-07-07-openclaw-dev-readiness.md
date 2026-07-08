# hermosskills — OpenClaw dev-readiness sprint (2026-07-07)

## Context
Uncle Pete requested developer access to OpenClaw from pdbjork@gmail.com.
Position goal: position hermosskills.com as an agentic skills repository,
marketplace, and collab tool so the site is OpenClaw-ready the moment dev
access lands. Priority order: repo surface first (gets dev approval unblocked),
marketplace polish second.

## What landed

### 1. Machine-readable catalog (`/catalog/v1/skills.json`)
- 6 charter skills in clawhub-compatible schema (name, identifier, version,
  trust_level, source, tags, sponsor_tiers, commission, public_good_rebate_pct).
- Initial path tried `/api/v1/skills.json` — nginx has an explicit
  `location /api/ { return 404; }` because /api/* is proxied to a Node
  Stripe/subscribe service. Renamed to `/catalog/v1/` to avoid the proxy
  collision. Same JSON shape, semantically cleaner (it's static published
  data, not a runtime API).

### 2. Per-skill JSON endpoints
- 6 endpoints at `/catalog/v1/skills/{id}.json`.
- Built by `build-skills.sh` from `data/skills.json` (single source of truth).

### 3. OpenClaw capability manifest (`/.well-known/openclaw.json`)
- Declares publisher, schema_compatibility (`clawhub-catalog-v1`,
  `moltbot-skill-md-1.x`), two surfaces (`curated_charter` + `full_repository`),
  install_pattern, submission criteria, commercial model.

### 4. Full Hermes repository surface (`/skills/{slug}/SKILL.md`)
- 84 SKILL.md files mirrored from `~/.hermes/skills/`.
- Each is curl-installable. OpenClaw agents can discover by directory listing
  or fetch by name.
- build-skills.sh walks top-level + business/ to capture both charter and
  class-level skills (like dogfood, used on homepage).

### 5. Discoverability
- `robots.txt` — allows /, /skills/, /catalog/, /.well-known/.
- `sitemap.xml` — 8 URLs, including skill detail pages.
- `<link rel="alternate" type="application/json">` in homepage head points
  to the JSON catalog.

### 6. New pages
- `/skills/` — full catalog index, editorial Pantone-style layout. Renders all
  6 charter skills with tags, trust badges, version, install link.
- `/submit.html` — manual-review submission intake. Email-based by design
  (no automated acceptance in v1.0). 14-day SLA documented.

### 7. Homepage updates
- Title: "a curated marketplace of agent skills" → "a curated marketplace &
  repository of agent skills".
- Meta description: mentions OpenClaw, Hermes, Claude Code, Moltbook
  compatibility and 30% public-good rebate.
- New "For developers" section with 3 cards: catalog JSON, install one-liner,
  OpenClaw manifest. Background tinted green to set it apart.
- Nav: "Catalog" links to `/skills/` instead of in-page anchor. New
  "For developers" link to `#developers`.

## nginx gotcha
The site is served by nginx with a strict `location /api/ { return 404; }`.
Any new endpoint under /api/ returns 404 silently. Either:
- Co-locate new endpoints under a different prefix (we chose /catalog/).
- OR update nginx config to allow specific paths under /api/ for static
  serving. We chose the rename for cleanliness — the catalog is published
  data, not a runtime endpoint.

## What was NOT in this turn
- Per-skill human-readable detail pages (only /skills/ index for now).
- Comments / collab surface.
- Sponsor logo gallery (the empty-state cold-start problem from market
  research remains; we have 0 sponsors live).
- /skills/{slug}/index.html pages — currently `/skills/{slug}/` only has
  SKILL.md, no landing page. The /catalog/v1/skills/{id}.json endpoint
  serves the data; human landing pages are next-up.

## Open questions / follow-ups
- OpenClaw approval: when dev access lands, register hermosskills as a
  source. The /.well-known/openclaw.json + /catalog/v1/skills.json are
  the integration points.
- Per-skill landing pages: need to build /skills/{slug}/index.html with
  sponsor CTA per skill. Probably 5-10 min each once template exists.
- Real sponsor logos: even 1-2 (Pete's existing businesses?) would close
  the cold-start gap on the homepage.
- /api/v1/skills.json still appears as stale endpoint reference inside
  one sentence of the og:description meta tag — verify before next push.

## Files added or modified

### Added
- `.well-known/openclaw.json` — capability manifest.
- `robots.txt` — agent-friendly crawl rules.
- `sitemap.xml` — 8 URLs.
- `catalog/v1/skills.json` — main catalog (6 skills).
- `catalog/v1/skills/{id}.json` × 6 — per-skill lookup.
- `skills/index.html` — full catalog browse page.
- `skills/{slug}/SKILL.md` × 84 — mirrored from ~/.hermes/skills/.
- `submit.html` — submission intake page.
- `build-skills.sh` — idempotent build script.
- `data/skills.json` — single source of truth for the catalog.

### Modified
- `index.html` — title, meta description, canonical URL, JSON-LD alt link,
  nav (Catalog → /skills/, +For developers), catalog copy ("Six skills"),
  +"For developers" section, +catalog browse CTA in catalog section.
- `package.json` — unchanged (build-skills.sh is shell, no Node change).

## Verification commands

```bash
# 12 endpoints, all should be HTTP 200:
for path in / /robots.txt /sitemap.xml /submit.html \
            /.well-known/openclaw.json /catalog/v1/skills.json \
            /skills/ /skills/index.html \
            /skills/stripe-go-live-workflow/SKILL.md \
            /catalog/v1/skills/dogfood.json; do
  curl -sS -o /dev/null -w "%{http_code} $path\n" "https://hermosskills.com$path"
done

# All 6 per-skill catalog JSON endpoints:
for s in stripe-go-live-workflow domain-availability-checker \
         public-good-ai-commercialization regulated-fintech-product-development \
         ai-visibility-for-small-sites dogfood; do
  curl -sS -o /dev/null -w "%{http_code} /catalog/v1/skills/$s.json\n" \
    "https://hermosskills.com/catalog/v1/skills/$s.json"
done
```