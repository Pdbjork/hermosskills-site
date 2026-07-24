# Operator public metrics honesty — 2026-07-24

## Problem

The public Hermosskills operator funnel was using raw `/api/operator-interest/stats` counts as proof metrics. The current data file contained smoke-test/example submissions, so the homepage and operator page could display “3 applications” and an average fit score even though those were not qualified real leads.

## Why it matters

For a trust-first agent-operations offer, inflated proof is worse than a low number. Public metrics should be conversion-supporting only when they are honest; otherwise the site should show zero/blank rather than laundering test data into traction.

## Fix shipped

- Added `isLikelyTestOperatorLead()` to identify obvious smoke-test submissions by disposable/test domains and placeholder names.
- Added `buildOperatorLeadStats()` so public stats return:
  - `count`: qualified/non-test leads only
  - `raw_count`: all stored records
  - `excluded_test_count`: records filtered from public proof
  - `avg_fit_score`: qualified leads only, or `null` when none are available
- Updated `/api/operator-interest/stats` to use the filtered stats builder.
- Changed homepage and operator-page proof counters from hard-coded `3` / `81` to loading states populated by the filtered API.
- Updated the operator thank-you page with concrete fit-review prep steps and links back to the pilot brief/checklist.
- Added Node tests covering test-lead detection and filtered public stats.

## Verification

Commands run from `/root/repos/hermosskills-site`:

```bash
npm test
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
for p in [Path('index.html'), Path('operator/index.html'), Path('operator/thanks.html')]:
    HTMLParser().feed(p.read_text())
    print('HTML_OK', p)
PY
git diff --check
```

Live checks after deploy/restart:

```text
https://hermosskills.com/api/operator-interest/stats
{"ok":true,"count":0,"raw_count":3,"excluded_test_count":3,"avg_fit_score":null}

https://hermosskills.com/ -> 200
https://hermosskills.com/operator/ -> 200
https://hermosskills.com/operator/thanks.html?score=82 -> 200
hermosskills.service -> active
```

## Reusable rule

Public proof metrics must be filtered before display. If only test/example data exists, show `0` or `—`, not seeded/demo counts.
