---
name: extend-existing-cron-not-duplicate
description: When the user asks for a recurring review cadence (weekly portfolio review, daily digest, monthly check-in) on a project that already has a cron job, ALWAYS inspect existing cron jobs first via `cronjob action='list'` and extend the matching job's prompt with `cronjob action='update'`. Never schedule a parallel cron that does overlapping work — duplicates the same data collection, double-delivers to chat, and complicates delivery semantics.
---

# Extend the existing cron — don't duplicate

## When to apply
The user says any of:
- "set a weekly review of the list"
- "schedule a daily/weekly/monthly X check"
- "remind me every Friday to ..."
- "ping me periodically about ..."
- "set up a recurring ..."

…and there is *any* existing cron in `/root/HermesVault/`, `/root/scripts/`, or referenced in `session_search` that touches the same subject matter.

## Steps

1. **`cronjob action='list'`** — see what already exists.
2. **Read the matching job's prompt and (if present) script path.**
3. **`cronjob action='update job_id=... prompt='...'`** — extend the prompt rather than create a parallel job. Keep the existing data-collection step verbatim; append new analysis steps. Add skill attachments (`skills=[...]`) if useful.
4. **Deliver explicit confirmation** that this was an extension, not a new job, so the user knows firing cadence is unchanged.

## Pitfalls

- **Don't change `schedule` or `repeat`** unless the user explicitly asked. If the cadence was already right, leave it.
- **Delivery:** if the original job delivers to `'local'` or `'origin'`, mirror that — don't override.
- **`no_agent: true` jobs** (script-only) cannot have their prompt meaningfully extended; instead either edit the script or schedule a new *agent-driven* cron with a clearly different deliverable (e.g. cron A scrapes → cron B interprets).
- **Trip wires in the prompt** — when extending a generic data report into a tier-review type job, embed explicit "what would change my mind" rules from the user-facing notes, so the LLM has structured criteria instead of vibes.
- **`enabled_toolsets`** — only set if you're narrowing the existing job's access; inheritance is usually fine.

## Verification
- `cronjob action='list'` again — confirm the count went down (or stayed) and the `next_run_at` is what you'd expect.
- Mentally simulate: would both jobs have fired at the same minute? If yes, you scheduled a duplicate. Fix it.
