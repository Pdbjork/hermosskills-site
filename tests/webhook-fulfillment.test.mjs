import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildContactLeadStats,
  buildContactLeadTask,
  buildFulfillmentStats,
  buildFulfillmentTask,
  buildOperatorLeadTask,
  buildOperatorLeadStats,
  isLikelyTestContactLead,
  isLikelyTestOperatorLead,
  isWeeklyTeardownContactLead,
  recordCheckoutFulfillment,
  recordContactLeadTask,
  recordOperatorLeadTask,
  sanitizeContactLead
} from '../server.mjs';

test('buildFulfillmentTask creates a human-gated task from a checkout session', () => {
  const task = buildFulfillmentTask({
    id: 'cs_test_123',
    mode: 'payment',
    amount_total: 50000,
    currency: 'usd',
    customer_details: { email: 'FOUNDER@EXAMPLE.COM' },
    metadata: { plan: 'commission', note: 'MCP conformance checks for public catalog skills' }
  }, { id: 'evt_test_123' });

  assert.equal(task.source, 'stripe.checkout.session.completed');
  assert.equal(task.status, 'needs_human_review');
  assert.equal(task.priority, 'high');
  assert.equal(task.customer_email, 'founder@example.com');
  assert.equal(task.plan, 'commission');
  assert.equal(task.sponsor_note, 'MCP conformance checks for public catalog skills');
  assert.equal(task.checkout_session_id, 'cs_test_123');
  assert.equal(task.event_id, 'evt_test_123');
  assert.ok(task.next_actions.some((line) => line.includes('Use sponsor note for initial fit')));
  assert.ok(task.next_actions.some((line) => line.includes('Do not perform outbound customer email')));
});

test('recordCheckoutFulfillment writes order, fulfillment task, and local alert', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hermosskills-fulfillment-'));
  const repoDir = path.join(root, 'repo');
  const dataDir = path.join(root, 'data');
  const session = {
    id: 'cs_test_456',
    mode: 'subscription',
    amount_total: 25000,
    currency: 'usd',
    customer_email: 'sponsor@example.com',
    metadata: { plan: 'founding', note: 'Sponsor deployment runbooks first' }
  };

  const task = await recordCheckoutFulfillment(session, { id: 'evt_test_456' }, { repoDir, dataDir });

  const orderLines = (await fs.readFile(path.join(repoDir, 'orders/stripe-checkouts.jsonl'), 'utf8')).trim().split('\n');
  const taskLines = (await fs.readFile(path.join(dataDir, 'fulfillment-tasks.jsonl'), 'utf8')).trim().split('\n');
  const alertLines = (await fs.readFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), 'utf8')).trim().split('\n');
  const writtenTask = JSON.parse(taskLines[0]);
  const alert = JSON.parse(alertLines[0]);

  assert.equal(orderLines.length, 1);
  assert.deepEqual(JSON.parse(orderLines[0]), session);
  assert.equal(taskLines.length, 1);
  assert.equal(writtenTask.id, task.id);
  assert.equal(writtenTask.status, 'needs_human_review');
  assert.equal(writtenTask.customer_email, 'sponsor@example.com');
  assert.equal(writtenTask.sponsor_note, 'Sponsor deployment runbooks first');
  assert.equal(alertLines.length, 1);
  assert.equal(alert.level, 'action_required');
  assert.equal(alert.task_id, task.id);
});

test('buildFulfillmentStats reports redacted queue totals for ops review', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hermosskills-fulfillment-stats-'));
  await fs.writeFile(path.join(dataDir, 'fulfillment-tasks.jsonl'), JSON.stringify({
    status: 'needs_human_review',
    priority: 'normal',
    source: 'stripe.checkout.session.completed',
    plan: 'sponsor',
    customer_email: 'sponsor@example.com'
  }) + '\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'operator-lead-tasks.jsonl'), JSON.stringify({
    status: 'needs_human_review',
    priority: 'high',
    source: 'operator-interest',
    customer_email: 'operator@example.com'
  }) + '\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'contact-lead-tasks.jsonl'), JSON.stringify({
    status: 'closed',
    priority: 'normal',
    source: 'contact-form',
    customer_email: 'contact@example.com'
  }) + '\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), '{"level":"review"}\n', 'utf8');

  assert.deepEqual(await buildFulfillmentStats({ dataDir }), {
    ok: true,
    redacted: true,
    totals: {
      checkout_fulfillment_tasks: 1,
      operator_lead_tasks: 1,
      contact_lead_tasks: 1,
      fulfillment_alerts: 1,
      open_human_review_tasks: 2
    },
    by_status: { needs_human_review: 2, closed: 1 },
    by_priority: { normal: 2, high: 1 },
    by_source: {
      'stripe.checkout.session.completed': 1,
      'operator-interest': 1,
      'contact-form': 1
    },
    by_plan: { sponsor: 1 }
  });
});

test('buildOperatorLeadTask prioritizes high-fit operator applications', () => {
  const task = buildOperatorLeadTask({
    id: 'oaas_test_123',
    email: 'FOUNDER@EXAMPLE.COM',
    url: 'https://example.com',
    budget: '2500',
    fit_score: 82,
    fit_band: 'Strong fit — priority review'
  });

  assert.equal(task.source, 'operator-interest');
  assert.equal(task.status, 'needs_human_review');
  assert.equal(task.priority, 'high');
  assert.equal(task.customer_email, 'founder@example.com');
  assert.equal(task.lead_id, 'oaas_test_123');
  assert.equal(task.fit_score, 82);
  assert.ok(task.next_actions.some((line) => line.includes('Do not send outbound email')));
});

test('recordOperatorLeadTask writes review task and alert without sending email', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hermosskills-operator-lead-'));
  const lead = {
    id: 'oaas_test_456',
    email: 'lead@example.com',
    url: 'https://lead.example',
    budget: '1500',
    fit_score: 61,
    fit_band: 'Possible fit — needs call'
  };

  const task = await recordOperatorLeadTask(lead, { dataDir });

  const taskLines = (await fs.readFile(path.join(dataDir, 'operator-lead-tasks.jsonl'), 'utf8')).trim().split('\n');
  const alertLines = (await fs.readFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), 'utf8')).trim().split('\n');
  const writtenTask = JSON.parse(taskLines[0]);
  const alert = JSON.parse(alertLines[0]);

  assert.equal(taskLines.length, 1);
  assert.equal(writtenTask.id, task.id);
  assert.equal(writtenTask.status, 'needs_human_review');
  assert.equal(writtenTask.customer_email, 'lead@example.com');
  assert.equal(alertLines.length, 1);
  assert.equal(alert.level, 'review');
  assert.equal(alert.task_id, task.id);
  assert.equal(alert.lead_id, 'oaas_test_456');
});

test('sanitizeContactLead bounds user input and normalizes contact intent', () => {
  const lead = sanitizeContactLead({
    name: '  Revenue Founder  ',
    email: 'FOUNDER@REALBUSINESS.COM ',
    intent: 'sponsor',
    subject: 'Founding sponsorship',
    message: 'I want to ask about sponsoring a public skill.'.repeat(40),
    url: 'https://realbusiness.com',
    urgency: 'urgent',
    consent: 'true',
    utm: { source: 'homepage' }
  }, { ip: '127.0.0.1', ua: 'node-test' });

  assert.equal(lead.name, 'Revenue Founder');
  assert.equal(lead.email, 'founder@realbusiness.com');
  assert.equal(lead.intent, 'sponsor');
  assert.equal(lead.urgency, 'urgent');
  assert.equal(lead.consent, true);
  assert.equal(lead.message.length, 1200);
  assert.equal(lead.ip, '127.0.0.1');
});

test('buildContactLeadTask prioritizes refund and privacy requests for human review', () => {
  const task = buildContactLeadTask({
    id: 'hs_contact_test_123',
    email: 'customer@example.com',
    intent: 'refund',
    subject: 'Need help with a charge',
    urgency: 'normal'
  });

  assert.equal(task.source, 'contact-form');
  assert.equal(task.status, 'needs_human_review');
  assert.equal(task.priority, 'high');
  assert.equal(task.customer_email, 'customer@example.com');
  assert.equal(task.label, 'Refund/support question');
  assert.ok(task.next_actions.some((line) => line.includes('Do not send outbound email')));
});

test('recordContactLeadTask writes contact review task and alert without sending email', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hermosskills-contact-lead-'));
  const lead = {
    id: 'hs_contact_test_456',
    email: 'founder@example.com',
    intent: 'commission',
    subject: 'Custom agent skill',
    message: 'Could you scope a custom agent skill for my site?',
    urgency: 'normal'
  };

  const task = await recordContactLeadTask(lead, { dataDir });

  const taskLines = (await fs.readFile(path.join(dataDir, 'contact-lead-tasks.jsonl'), 'utf8')).trim().split('\n');
  const alertLines = (await fs.readFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), 'utf8')).trim().split('\n');
  const writtenTask = JSON.parse(taskLines[0]);
  const alert = JSON.parse(alertLines[0]);

  assert.equal(taskLines.length, 1);
  assert.equal(writtenTask.id, task.id);
  assert.equal(writtenTask.status, 'needs_human_review');
  assert.equal(writtenTask.customer_email, 'founder@example.com');
  assert.equal(alertLines.length, 1);
  assert.equal(alert.level, 'review');
  assert.equal(alert.task_id, task.id);
  assert.equal(alert.lead_id, 'hs_contact_test_456');
});

test('buildContactLeadStats excludes test contacts and counts weekly teardown requests', () => {
  const leads = [
    {
      name: 'Test',
      email: 'test@example.com',
      intent: 'operator',
      subject: 'Send me the weekly operator teardown',
      message: 'smoke test submission for the weekly operator teardown',
      utm: { source: 'weekly_teardown', campaign: 'weekly_teardown' }
    },
    {
      name: 'Rae Founder',
      email: 'rae@realbusiness.com',
      intent: 'operator',
      subject: 'Send me the weekly operator teardown',
      message: 'Please send me the weekly operator teardown for my live site.',
      utm: { source: 'weekly_teardown', campaign: 'weekly_teardown' }
    },
    {
      name: 'Mina Sponsor',
      email: 'mina@trustco.org',
      intent: 'sponsor',
      subject: 'Sponsorship question',
      message: 'I want to ask about a founding sponsorship.'
    }
  ];

  assert.equal(isLikelyTestContactLead(leads[0]), true);
  assert.equal(isLikelyTestContactLead(leads[1]), false);
  assert.equal(isWeeklyTeardownContactLead(leads[1]), true);
  assert.deepEqual(buildContactLeadStats(leads), {
    ok: true,
    count: 2,
    raw_count: 3,
    excluded_test_count: 1,
    weekly_teardown_count: 1,
    weekly_teardown_raw_count: 2,
    by_intent: {
      operator: 1,
      sponsor: 1,
      commission: 0,
      skill: 0,
      refund: 0,
      privacy: 0,
      other: 0
    }
  });
});

test('isLikelyTestOperatorLead identifies seed and smoke-test submissions', () => {
  assert.equal(isLikelyTestOperatorLead({ email: 'test@example.com', url: 'https://example.com', name: 'Test' }), true);
  assert.equal(isLikelyTestOperatorLead({ email: 'x@y.com', url: 'https://z.com', name: 'X' }), true);
  assert.equal(isLikelyTestOperatorLead({ email: 'founder@realbusiness.com', url: 'https://realbusiness.com', name: 'Rae Founder' }), false);
});

test('buildOperatorLeadStats excludes likely test leads from public proof metrics', () => {
  const stats = buildOperatorLeadStats([
    { email: 'test@example.com', url: 'https://example.com', name: 'Test', fit_score: 82 },
    { email: 'x@y.com', url: 'https://z.com', name: 'X', fit_score: null },
    { email: 'founder@realbusiness.com', url: 'https://realbusiness.com', name: 'Rae Founder', fit_score: 91 },
    { email: 'ops@careco.org', url: 'https://careco.org', name: 'Care Co', fit_score: 73 }
  ]);

  assert.deepEqual(stats, {
    ok: true,
    count: 2,
    raw_count: 4,
    excluded_test_count: 2,
    avg_fit_score: 82
  });
});
