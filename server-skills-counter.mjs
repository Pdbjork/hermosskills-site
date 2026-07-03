// Hermosskills live "skills maintained this month" counter
// Drop-in for /root/repos/hermosskills-site/server.mjs
//
// Adds two endpoints:
//   GET /api/stats          — total skills maintained, this-month count,
//                             cumulative count, and a per-skill roster
//                             (id, title, version, last_maintained_at).
//                             Source of truth: server-side JSON file at
//                             /root/repos/hermosskills-site/data/skills.json
//                             (created below).
//   GET /skills-maintained  — small JSON-LD-free public object for the
//                             FAQ to call from the browser.
//
// The counter is intentionally server-side (not Stripe-driven) because
// the cold-start story requires showing "skills maintained" BEFORE the
// first sponsor pays. We count every skill that has a last_maintained_at
// timestamp in the current month, regardless of whether anyone has
// sponsored yet.
//
// Deploy ritual (Pete):
//   1. cp /root/repos/hermosskills-site/server.mjs \
//         /root/repos/hermosskills-site/server.mjs.bak.$(date +%Y%m%d-%H%M%S)
//   2. cat /root/repos/hermosskills-site/server-skills-counter.mjs >> \
//         /root/repos/hermosskills-site/server.mjs
//      (then move the new endpoints above app.listen — see patch block below)
//   3. mkdir -p /root/repos/hermosskills-site/data
//   4. install -o www-data -g www-data -m 644 \
//         /root/repos/hermosskills-site/data/skills.json \
//         /var/www/hermosskills.com/data/skills.json   # (only if serving
//                                                       #  from /var/www —
//                                                       #  the current site
//                                                       #  is express-static
//                                                       #  from the repo
//                                                       #  root, so this
//                                                       #  step is optional)
//   5. install -o root -g root -m 644 \
//         /root/repos/hermosskills-site/data/skills.json \
//         /var/www/hermosskills.com/data/skills.json
//   6. systemctl restart hermosskills
//   7. curl -s https://hermosskills.com/api/stats  →  expect JSON
//   8. curl -s https://hermosskills.com/skills-maintained  →  expect JSON
//
// The patch block below goes immediately BEFORE the final
// `app.listen(port, '127.0.0.1', () => {` line in server.mjs.
// Each endpoint is additive; the existing /api/health and
// /api/create-checkout-session paths are untouched.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DATA = path.join(__dirname, 'data', 'skills.json');

async function readSkillsRoster() {
  try {
    const raw = await fs.readFile(SKILLS_DATA, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.skills)) return [];
    return parsed.skills;
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    // Treat parse errors as empty so the API stays live; the FAQ will
    // surface a "(counter temporarily unavailable)" copy.
    console.error('skills.json read error', err.message);
    return [];
  }
}

function monthKey(iso) {
  if (!iso) return '';
  // YYYY-MM prefix is enough; the counter only changes monthly.
  return String(iso).slice(0, 7);
}

function thisMonthKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

app.get('/api/stats', async (_req, res) => {
  const roster = await readSkillsRoster();
  const thisMonth = thisMonthKey();
  const maintainedThisMonth = roster.filter(
    (s) => s && s.last_maintained_at && monthKey(s.last_maintained_at) === thisMonth
  );
  res.json({
    ok: true,
    site: 'hermosskills',
    total_skills: roster.length,
    maintained_this_month: maintainedThisMonth.length,
    this_month: thisMonth,
    cumulative_maintained: roster.filter((s) => s && s.last_maintained_at).length,
    skills: roster.map((s) => ({
      id: s.id,
      title: s.title,
      version: s.version || 'v0',
      last_maintained_at: s.last_maintained_at || null,
      maintainer: s.maintainer || null,
      sponsored: Boolean(s.sponsored),
      rebate_active: Boolean(s.rebate_active)
    }))
  });
});

app.get('/skills-maintained', async (_req, res) => {
  const roster = await readSkillsRoster();
  const thisMonth = thisMonthKey();
  const maintainedThisMonth = roster.filter(
    (s) => s && s.last_maintained_at && monthKey(s.last_maintained_at) === thisMonth
  );
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    ok: true,
    maintained_this_month: maintainedThisMonth.length,
    this_month: thisMonth,
    as_of: new Date().toISOString(),
    copy: maintainedThisMonth.length === 0
      ? 'Charter catalog — first maintained-skill update drops this month.'
      : `${maintainedThisMonth.length} skill${maintainedThisMonth.length === 1 ? '' : 's'} maintained this month.`
  });
});
