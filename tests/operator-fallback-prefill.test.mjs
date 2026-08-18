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

  assert.match(operator, /Weekly operator teardown lead magnet/);
  assert.match(operator, /Get the weekly operator teardown/);
  assert.match(operator, /href="\/weekly-teardown\/\?utm_source=operator/);
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

test('operator brief does not hard-code seeded application proof', async () => {
  const html = await readFile(path.join(repoDir, 'operator/brief/index.html'), 'utf8');

  assert.match(html, /id="brief-leads-count">—<\/strong><span class="muted">qualified applications/);
  assert.match(html, /fetch\('\/api\/operator-interest\/stats'/);
  assert.match(html, /stats\.excluded_test_count > 0/);
  assert.match(html, /We do not show seeded traction/);
  assert.doesNotMatch(html, /<strong>3<\/strong><span class="muted">founding applications/);
  assert.doesNotMatch(html, /<strong>81<\/strong><span class="muted">avg fit score/);
});
