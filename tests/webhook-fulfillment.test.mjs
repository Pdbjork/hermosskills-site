import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildFulfillmentTask,
  buildOperatorLeadTask,
  recordCheckoutFulfillment,
  recordOperatorLeadTask
} from '../server.mjs';

test('buildFulfillmentTask creates a human-gated task from a checkout session', () => {
  const task = buildFulfillmentTask({
    id: 'cs_test_123',
    mode: 'payment',
    amount_total: 50000,
    currency: 'usd',
    customer_details: { email: 'FOUNDER@EXAMPLE.COM' },
    metadata: { plan: 'commission' }
  }, { id: 'evt_test_123' });

  assert.equal(task.source, 'stripe.checkout.session.completed');
  assert.equal(task.status, 'needs_human_review');
  assert.equal(task.priority, 'high');
  assert.equal(task.customer_email, 'founder@example.com');
  assert.equal(task.plan, 'commission');
  assert.equal(task.checkout_session_id, 'cs_test_123');
  assert.equal(task.event_id, 'evt_test_123');
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
    metadata: { plan: 'founding' }
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
  assert.equal(alertLines.length, 1);
  assert.equal(alert.level, 'action_required');
  assert.equal(alert.task_id, task.id);
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
