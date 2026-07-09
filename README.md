# hermosskills — site

Landing page for hermosskills, a curated marketplace for AI-agent skills.

- Domain: `hermosskills.com`
- Hosted on: Linux VPS (this host), nginx
- Style: editorial publication (warm paper bg, deep green + copper + gold accents, no app-store chrome)

## Files

- `index.html` — the full landing page (single-file, no JS dependencies)
- `assets/favicon.svg` — gradient mark (green → gold → copper)

## Local preview

```
python3 -m http.server 8001 --directory /root/repos/hermosskills-site
```

Then open http://localhost:8001/

## Deploy

```
sudo rsync -av --delete /root/repos/hermosskills-site/ /var/www/hermosskills.com/
sudo nginx -t && sudo systemctl reload nginx
```

## Status

2026-06-22 - v0.1 landing page shipped:
- Editorial hero (publication framing, not app-store)
- Funding-transparency card (3 streams: sponsorships, commissions, public-good rebate)
- 7-skill charter catalog (real, installed local skills, not invented)
- 4 editorial principles
- Sponsor / Commission / Submit CTA → team@hermosskills.com → admin@bjorked.com

## Roadmap

- [ ] Per-skill detail pages (`/skills/<slug>/`) with version history + sponsor logos
- [ ] Real backend for sponsor pledges (Stripe Checkout, $49–$999/mo tiers)
- [ ] Submit-a-skill form (Tally / Cloudflare Worker)
- [ ] Public-good rebate ledger (auto-published monthly)
- [ ] Public GitHub repo (currently local only)
