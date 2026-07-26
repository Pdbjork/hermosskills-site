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
