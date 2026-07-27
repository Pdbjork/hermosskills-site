# Operator funnel CTA and report filter — 2026-07-27

## Problem

The daily revenue loop read raw operator applications as if they were qualified leads, while the public site had already filtered the same three records as smoke tests. That mismatch pointed the agent toward follow-up work for fake demand. The operator page also led with secondary reading links before the $2,500 pilot application.

## Fix shipped

- Updated `/root/scripts/autonomous_business_report.py` to mirror the public test-lead filter and report qualified, raw, and excluded counts separately.
- Re-ran the report so `/root/HermesVault/autonomous-business-report.md` now shows `0 qualified / 3 raw` operator applications.
- Updated the homepage operator proof card from vague current-signal copy to `Filtered demand` with `qualified applications after test filtering`.
- Added a primary `$2,500` application CTA near the operator-page hero and changed proof messaging to show founding slots plus filtered application count.
- Prepared an approval-gated outbound asset at `/root/HermesVault/Hermosskills-Operator-Pilot-Outbound-Asset-2026-07-27.md`.

## Verification

Run from `/root/repos/hermosskills-site`:

```bash
npm test
python3 -m py_compile /root/scripts/autonomous_business_report.py
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
for p in [Path('index.html'), Path('operator/index.html')]:
    HTMLParser().feed(p.read_text())
    print('HTML_OK', p)
PY
python3 /root/scripts/autonomous_business_report.py
git diff --check
```

Expected report signal after rerun:

```text
Hermosskills operator applications: 0 qualified / 3 raw; 0 qualified high-fit; excluded tests 3
```

## Reusable rule

Revenue-command reports must use the same qualified/public-proof filters as the live product. If the site excludes smoke-test data, the internal action queue must exclude it too. Otherwise the agent spends follow-up time on fake demand instead of distribution.
