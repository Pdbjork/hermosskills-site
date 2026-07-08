---
name: domain-availability-checker
description: Use when picking a brand name and you need to know which .com (or other TLD) variants are actually registerable before you commit. Runs concurrent whois lookups, retries on timeout, sorts FREE candidates first, and prints a clean table or machine-readable JSON/CSV. Safe and unattended — never touches registrar APIs or purchases anything.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [domain, whois, naming, branding, due-diligence, ops]
    related_skills: [public-good-ai-commercialization, github-pages-product-landing]
---

# Domain Availability Checker

## Overview

You just brainstormed a shortlist of brand names and need to know which `.com` variants are actually registerable before you fall in love with one. This skill wraps `whois` into a parallel, retry-on-timeout checker that sorts FREE candidates first, prints a clean table, and supports JSON/CSV/free-only output for piping into other tools.

It is intentionally **read-only**: it queries public WHOIS servers and reports status. It never registers, transfers, or modifies domains. Purchase decisions stay with the human at the registrar.

## When to Use

- **Naming a new project or business** and you have 5–100 candidate names to triage against `.com`.
- **Reclaiming a brand across TLDs** (`.com`, `.store`, `.shop`, `.co`, `.studio`) once you have a primary candidate.
- **Auditing a competitor or acquisition target's domain footprint** — pass a list, get availability in seconds.
- **Brand-protection sweeps** — check 50 close variants of your brand to spot cybersquatters or available adjacents.

Do NOT use for:

- Bulk registration of typosquatted domains (off-label; may violate registrar ToS).
- Checking WHOIS for personally identifying information about a registrant — that requires a paid RDAP-aware lookup, not raw whois.
- Anything time-sensitive: whois rate-limits aggressively; if you need bulk at scale (>500), use a paid RDAP provider.

## Quick start

```bash
# 1. Drop candidate names into a file (one per line)
cat > /tmp/names.txt <<'EOF'
plantone
florapigments
verdantindex
bloompantone
EOF

# 2. Run the checker
python3 ~/.hermes/skills/business/domain-availability-checker/scripts/check_whois.py \
    --input /tmp/names.txt

# Output:
# NAME              STATUS    DETAIL
# ==================================================
# florapigments     .com  FREE
# verdantindex      .com  FREE
# bloompantone      .com  FREE
# plantone          .com  taken   Creation Date: 2009-03-25T18:23:52Z
#
#   3 FREE  |  1 TAKEN  |  0 OTHER
```

Or pipe directly:

```bash
echo "plantone\nflorapigments\nverdantindex" | python3 check_whois.py --stdin
# Or pass as arguments
python3 check_whois.py plantone florapigments verdantindex
```

## Common options

| Flag | Purpose | Example |
|---|---|---|
| `--tld` | Check a TLD other than `.com` | `--tld store` |
| `--input` / `-i` | File with one name per line | `-i candidates.txt` |
| `--stdin` | Read names from stdin | `cat x.txt \| ... --stdin` |
| `--workers` / `-w` | Parallel whois workers | `-w 12` (default 8) |
| `--format` | Output shape | `table` \| `json` \| `csv` \| `free-only` |
| `--retries` | Who-is timeout retries | `--retries 2` (default 1) |

### Useful one-liners

Get just the available names for piping into another tool:

```bash
python3 check_whois.py -i candidates.txt --format free-only
# plantone.com
# verdantindex.com
```

Check the same name across 5 TLDs:

```bash
for tld in com store shop co studio; do
  python3 check_whois.py --tld "$tld" plantone
done
```

JSON for programmatic use:

```bash
python3 check_whois.py plantone verdantindex --format json | jq '.[] | select(.status == "FREE") | .name'
```

## How it works

1. **Normalization.** Input lines are stripped of any `.tld` so users can paste `plantone.com` or `plantone` interchangeably. Comments (`#`) and blanks are skipped.
2. **Deduplication.** Identical names are folded. Output preserves first-seen order within each status group.
3. **Parallel whois.** `ThreadPoolExecutor` runs up to 8 (configurable) `whois -H` lookups concurrently. Most public WHOIS servers rate-limit at ~10 req/sec per IP; default 8 workers stays safely under that for `.com`.
5. **Retry on timeout + DIG-SOA fallback.** Some TLD WHOIS servers (especially `.shop` and `.store`) take 15–20s to respond. Each lookup retries once before reporting `TIMEOUT`. The script's whois timeout default is now 20s. **When whois returns `TIMEOUT` or `?`, the script falls back to a DIG-SOA query** to catch the class of false-negatives where a slow whois server times out for a domain that's actually registered (e.g. `flowertone.com` in the 2026-06-21 session). See `references/dig-soa-fallback.md` for the standalone DIG verifier and the failure-mode backstory.
5. **Status classification.** The script looks for explicit RDAP/whois strings that mean "registered" vs "not registered." When the registry's English is ambiguous (rare for `.com`, common for country-code TLDs), the script reports `?` rather than guessing — re-check those manually.

### Status codes

| Status | Meaning | Action |
|---|---|---|
| `FREE` | No registration found for `name.tld` | Safe to register via your registrar |
| `TAKEN` | Registration exists; `detail` shows creation date | Check who owns it; maybe buy on aftermarket |
| `TIMEOUT` | Whois server didn't respond within timeout+retries | Re-run later or check manually |
| `?` | Whois returned an unrecognized response shape | Inspect manually with `whois -H name.tld` |
| `ERROR` | Whois binary not installed or other local error | See Common Pitfalls below |

## Common Pitfalls

1. **`whois` not installed.** The script shells out to `/usr/bin/whois`. On Debian/Ubuntu: `apt-get install -y whois`. On macOS: `brew install whois`. On minimal containers: bake the package into your image. Without it, every lookup returns `ERROR`.
2. **`TIMEOUT` and `?` are NOT `FREE`.** This bit a 2026-06-21 session where `flowertone.com` returned `TIMEOUT` from whois but was actually registered at Porkbun (redirected to a resale landing page). The script now falls back to DIG-SOA on `TIMEOUT`/`?` automatically. If the fallback also fails, treat the result as **unknown, not free** — verify manually via the registrar's search before committing budget.
3. **Network egress blocked.** Some cloud sandboxes block outbound WHOIS (port 43 TCP). Test with `whois google.com` from the same shell before running the script.
4. **Country-code TLDs lie.** TLDs like `.io`, `.ai`, `.co` often return `TAKEN` even for short brandable strings because speculators squat. The script can't distinguish speculator from end-user; that's a registrar-level detail.
5. **Premium domains.** A `FREE` result only means the domain is unregistered. Premium names (short, dictionary words, single-syllable) often have a **registration fee of $1k–$50k+** even when first-time registered. Always check the registrar's price before celebrating.
6. **Trademark conflicts.** A `FREE` domain can still be legally unusable if it matches an existing trademark. Pair this skill with a USPTO/EUIPO search before committing budget.
7. **Punycoded IDN domains.** `münchen.de` looks different in whois than `xn--mnchen-3ya.de`. The script doesn't normalize IDN; pass the ASCII form.
8. **`DIG` not installed.** The DIG-SOA fallback requires the `bind-utils` (Debian/Ubuntu) or `bind` (macOS via Homebrew) package. Without it, every `TIMEOUT`/`?` falls through to the original error. The script does not warn explicitly when dig is missing; if you see `TIMEOUT`/`?` results with no fallback detail, check `which dig`.

## Verification Checklist

- [ ] `python3 ~/.hermes/skills/business/domain-availability-checker/scripts/check_whois.py --help` prints usage
- [ ] Run on a known-taken name (e.g. `google`) and confirm it returns `TAKEN`
- [ ] Run on a known-impossible name (e.g. `xzqksdfglkjh`) and confirm it returns `FREE`
- [ ] `--format json` output parses as valid JSON
- [ ] `--format free-only` output lists only `FREE` names, one per line
- [ ] On a sandbox without `whois`, the script exits with helpful `ERROR` rows, not a traceback
- [ ] On a sandbox without `dig`, `TIMEOUT`/`?` results have NO "DIG-SOA fallback" detail; install `bind-utils` (Debian/Ubuntu) or `bind` (macOS) if you need the fallback

## Linked references

- `references/whois-output-fields.md` — what each whois registry returns and how the classifier decides FREE vs TAKEN
- `references/dig-soa-fallback.md` — why `TIMEOUT`/`?` aren't `FREE`, the standalone DIG-SOA verifier, and the failure mode that produced this skill

## Brand-naming session workflow (the recursive "test X?" loop)

A real brand-naming session doesn't start with a 50-name shortlist. It starts with a thesis (one or two sentences about what the brand IS) and then the human fires one name at a time to test against the live register. The skill should support that loop, not fight it:

1. **One name per lookup.** Don't batch into a long file the first time — let the human react to each result and steer the next name.
2. **Treat `TAKEN` results as intel.** If `chromaflora.com` is taken and turns out to be a real SF design studio, that's useful signal — the human can pivot to a cousin (`chromebloom`, `chromapetal`) or a different portmanteau.
3. **Cite the holder, not just the date.** When a domain is taken, fetch the live site (`curl -sI` or browser_navigate) and surface "this is an active design studio" or "this is a Porkbun resale page" — the human needs that context to decide whether to pursue aftermarket, pivot, or move on.
4. **Delegate creative open-ended work to a different-model subagent.** Naming is the canonical case for `delegate_task` on a different model (e.g. GPT-5.5). The coding model (default) handles the whois/DIG verification; the creative model handles "give me 6 names in the spirit of X, ranked." Spawn the subagent in parallel with the technical verification so neither blocks the other.

For the full operator-side pattern on how this skill pairs with a marketplace listing or a launch, see `public-good-ai-commercialization` — specifically its references on structured skill catalogs and the marketplace-as-funding-engine thesis.