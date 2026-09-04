import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoDir = path.resolve(import.meta.dirname, '..');

test('operator API fallback carries the application summary into contact form params', async () => {
  const html = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');

  assert.match(html, /const message = encodeURIComponent\(\[/);
  assert.match(html, /Operator pilot fallback application \(API did not complete\)\./);
  assert.match(html, /'Fit score: ' \+ fit_score \+ ' \/ 100 · ' \+ data\.fit_band/);
  assert.match(html, /'4-week goal:'/);
  assert.match(html, /'Consent confirmed on operator form: ' \+ \(data\.consent \? 'yes' : 'no'\)/);
  assert.match(html, /&message=' \+ message \+ '&utm_source=operator&utm_medium=fallback&utm_campaign=form_first/);
});

test('contact form accepts a message query param for operator fallback prefill', async () => {
  const html = await readFile(path.join(repoDir, 'contact/index.html'), 'utf8');

  assert.match(html, /const message = params\.get\('message'\);/);
  assert.match(html, /if \(message && form\.message\) form\.message\.value = message\.slice\(0, 1200\);/);
});

test('operator form clarifies no card is charged before fit approval', async () => {
  const html = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');

  assert.match(html, /No card is charged from this form\./);
  assert.match(html, /Payment only happens after the fit call and an approved scope\./);
});

test('operator page names concrete week-one deliverables above the application', async () => {
  const html = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');

  assert.match(html, /What ships in week one/);
  assert.match(html, /One live checkout, CTA, or subscriber-flow fix with before\/after proof\./);
  assert.match(html, /Three approval-ready outreach or follow-up drafts queued for your yes\/no\./);
  assert.match(html, /A daily revenue command report: profit, followers\/subscribers, leads, blockers, next action\./);
});

test('operator sample report is linked from the operator funnel and names honest metrics', async () => {
  const operator = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');
  const brief = await readFile(path.join(repoDir, 'operator/brief/index.html'), 'utf8');
  const checklist = await readFile(path.join(repoDir, 'operator/checklist/index.html'), 'utf8');
  const sample = await readFile(path.join(repoDir, 'operator/sample-report/index.html'), 'utf8');

  assert.match(operator, /href="\/operator\/sample-report\/">See a sample daily report/);
  assert.match(brief, /href="\/operator\/sample-report\/">See a sample daily report/);
  assert.match(checklist, /href="\/operator\/sample-report\/">Sample report/);
  assert.match(sample, /Sample daily revenue command report/);
  assert.match(sample, /Profit today: \$0 confirmed from Stripe\./);
  assert.match(sample, /Subscribers: 0 confirmed from list system\./);
  assert.match(sample, /nothing sent without approval/i);
  assert.match(sample, /\/operator\/\?plan=2500&utm_source=sample_report/);
});

test('operator funnel offers a low-friction weekly teardown landing page', async () => {
  const operator = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');
  const sample = await readFile(path.join(repoDir, 'operator/sample-report/index.html'), 'utf8');
  const home = await readFile(path.join(repoDir, 'index.html'), 'utf8');
  const teardown = await readFile(path.join(repoDir, 'weekly-teardown/index.html'), 'utf8');

  assert.match(operator, /One URL proof path/);
  assert.match(operator, /Proof-first path: send one URL before you apply\./);
  assert.match(operator, /Send one URL/);
  assert.match(operator, /href="\/weekly-teardown\/\?utm_source=operator&amp;utm_medium=one_url_proof&amp;utm_campaign=weekly_teardown#teardown-inline-form/);
  assert.match(operator, /No list signup, no automation, no private data\./);
  assert.match(sample, /Want the low-friction proof trail\?/);
  assert.match(sample, /Get the weekly teardown/);
  assert.match(sample, /href="\/weekly-teardown\/\?utm_source=sample_report_close/);
  assert.match(home, /Weekly operator teardown now open/);
  assert.match(home, /href="\/weekly-teardown\/\?utm_source=homepage&utm_medium=hero&utm_campaign=weekly_teardown/);
  assert.match(home, /href="\/weekly-teardown\/\?utm_source=homepage&utm_medium=nav&utm_campaign=weekly_teardown/);
  assert.match(home, /href="\/weekly-teardown\/\?utm_source=homepage&utm_medium=hero_strip&utm_campaign=weekly_teardown/);
  assert.match(home, /See the operator loop before you apply/);
  assert.match(home, /href="\/weekly-teardown\/\?utm_source=homepage/);
  assert.match(teardown, /Get one operator teardown before you apply/);
  assert.match(teardown, /0<\/strong><span>qualified teardown requests/);
  assert.match(teardown, /fetch\('\/api\/contact\/stats'/);
  assert.match(teardown, /stats\.weekly_teardown_count/);
  assert.match(teardown, /stats\.excluded_test_count/);
  assert.match(teardown, /Do not send passwords, tokens, private customer exports/);
  assert.match(teardown, /utm_source=weekly_teardown&amp;utm_medium=landing_page&amp;utm_campaign=weekly_teardown/);
  assert.match(teardown, /Pick the teardown that matches the metric/);
  assert.match(teardown, /Request checkout teardown/);
  assert.match(teardown, /utm_content=checkout_pricing/);
  assert.match(teardown, /Request subscriber teardown/);
  assert.match(teardown, /utm_content=subscriber_waitlist/);
  assert.match(teardown, /Request offer teardown/);
  assert.match(teardown, /utm_content=homepage_offer/);
  assert.match(teardown, /id="teardown-inline-form"/);
  assert.match(teardown, /id="one-line-ask"/);
  assert.match(teardown, /Fastest useful reply: one URL\./);
  assert.match(teardown, /smallest non-sales ask: send one public surface and the metric you want moved/);
  assert.match(teardown, /utm_medium=one_line_ask&amp;utm_campaign=one_url_proof/);
  assert.match(teardown, /One%20URL%20operator%20teardown/);
  assert.match(teardown, /Could you teardown this one URL for the fastest safe checkout, subscriber, or reply improvement/);
  assert.match(teardown, /Public URL to inspect/);
  assert.match(teardown, /fetch\('\/api\/contact'/);
  assert.match(teardown, /medium: 'inline_form'/);
  assert.match(teardown, /content: 'quick_request'/);
  assert.match(home, /choose a checkout, subscriber, or homepage teardown template/);
  assert.match(home, /weekly-teardown\/\?utm_source=homepage&utm_medium=hero_strip&utm_campaign=weekly_teardown#request-templates/);
});

test('operator application offers one-click templates for high-intent founders', async () => {
  const html = await readFile(path.join(repoDir, 'operator/index.html'), 'utf8');

  assert.match(html, /aria-label="Application templates"/);
  assert.match(html, /data-application-template="checkout"/);
  assert.match(html, /Use the checkout rescue template/);
  assert.match(html, /data-application-template="subscriber"/);
  assert.match(html, /Use the subscriber-growth template/);
  assert.match(html, /data-application-template="ops"/);
  assert.match(html, /Use the ops follow-through template/);
  assert.match(html, /const applicationTemplates = {/);
  assert.match(html, /application_template_' \+ kind/);
  assert.match(html, /form\.elements\[field\]\.value = template\[field\]/);
  assert.match(html, /first qualified purchase attempts measured/);
});

test('sponsor brief offers an inline sponsor question form before checkout', async () => {
  const html = await readFile(path.join(repoDir, 'sponsor/index.html'), 'utf8');

  assert.match(html, /id="sponsor-question"/);
  assert.match(html, /Two-minute sponsor fit check/);
  assert.match(html, /id="sponsor-fit-form"/);
  assert.match(html, /Skill Sponsor — \$49\/mo/);
  assert.match(html, /Founding Sponsor — \$250\/mo/);
  assert.match(html, /Custom commission — \$500 deposit/);
  assert.match(html, /fetch\('\/api\/contact'/);
  assert.match(html, /intent: 'sponsor'/);
  assert.match(html, /campaign: 'sponsor_fit'/);
  assert.match(html, /medium: 'inline_form'/);
  assert.match(html, /No automated outbound or newsletter signup/);
});

test('sponsor funnel has a forwardable maintainer-economics pitch', async () => {
  const home = await readFile(path.join(repoDir, 'index.html'), 'utf8');
  const sponsor = await readFile(path.join(repoDir, 'sponsor/index.html'), 'utf8');
  const pitch = await readFile(path.join(repoDir, 'sponsor/maintainer-economics/index.html'), 'utf8');

  assert.match(home, /\/sponsor\/maintainer-economics\/\?utm_source=homepage&utm_medium=commission_panel&utm_campaign=maintainer_pitch/);
  assert.match(sponsor, /Read the maintainer-economics pitch/);
  assert.match(sponsor, /\/sponsor\/maintainer-economics\/\?utm_source=sponsor&utm_medium=hero&utm_campaign=maintainer_pitch/);
  assert.match(pitch, /Maintainer economics for agent skills/);
  assert.match(pitch, /Forwardable 1-page pitch/);
  assert.match(pitch, /Fastest useful reply: one line\./);
  assert.match(pitch, /Name the first skill category to maintain, the MCP\/audit check you would need to trust, or the proof that would make sponsorship credible/);
  assert.match(pitch, /href="#reply-paths"/);
  assert.match(pitch, /Pick a one-line reply path/);
  assert.match(pitch, /30% public-good rebate/);
  assert.match(pitch, /https:\/\/hermosskills.com\/sponsor\/maintainer-economics\//);
  assert.match(pitch, /No hidden placement or fake endorsement/);
  assert.match(pitch, /Approval-gated: review the actual thread before sending/);
});

test('maintainer economics pitch has structured reply paths for outreach follow-up', async () => {
  const pitch = await readFile(path.join(repoDir, 'sponsor/maintainer-economics/index.html'), 'utf8');

  assert.match(pitch, /id="reply-paths"/);
  assert.match(pitch, /Fast reply paths for the current outreach wave/);
  assert.match(pitch, /utm_campaign=maintainer_followup/);
  assert.match(pitch, /utm_content=first_skill/);
  assert.match(pitch, /utm_content=audit_critique/);
  assert.match(pitch, /utm_content=proof_request/);
  assert.match(pitch, /Skill%20category%20to%20maintain%20first/);
  assert.match(pitch, /Critique%20the%20Hermosskills%20audit%20workflow/);
  assert.match(pitch, /Proof%20needed%20before%20sponsoring%20Hermosskills/);
});

test('homepage checkout asks for sponsor skill intent before Stripe', async () => {
  const html = await readFile(path.join(repoDir, 'index.html'), 'utf8');

  assert.match(html, /id="checkout-intent-form"/);
  assert.match(html, /Skill\/category to sponsor first/);
  assert.match(html, /human-reviewed sponsor\/commission task/);
  assert.match(html, /const note = intentForm \? String\(intentForm\.elements\.note\.value \|\| ''\)\.trim\(\) : '';/);
  assert.match(html, /Please name the skill, category, or proof question before opening checkout\./);
  assert.match(html, /Please confirm the human-review boundary before checkout\./);
  assert.match(html, /body: JSON\.stringify\(\{ plan, email, note \}\)/);
});

test('operator brief does not hard-code seeded application proof', async () => {
  const html = await readFile(path.join(repoDir, 'operator/brief/index.html'), 'utf8');

  assert.match(html, /id="brief-leads-count">—<\/strong><span class="muted">qualified applications/);
  assert.match(html, /fetch\('\/api\/operator-interest\/stats'/);
  assert.match(html, /stats\.excluded_test_count > 0/);
  assert.match(html, /We do not show seeded traction/);
  assert.doesNotMatch(html, /<strong>3<\/strong><span class="muted">founding applications/);
  assert.doesNotMatch(html, /<strong>81<\/strong><span class="muted">avg fit score/);
});


test('homepage operator CTA offers a proof-first one URL path before the paid pilot', async () => {
  const home = await readFile(path.join(repoDir, 'index.html'), 'utf8');

  assert.match(home, /Send one URL first/);
  assert.match(home, /utm_source=homepage&utm_medium=revenue_panel&utm_campaign=one_url_proof#teardown-inline-form/);
  assert.match(home, /Proof-first option: send one public URL, get the first revenue-surface fix and approval queue preview/);
});
