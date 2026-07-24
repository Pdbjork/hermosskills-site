import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3019);
const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://hermosskills.com';
const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' }) : null;
const fulfillmentDataDir = process.env.HERMOSSKILLS_FULFILLMENT_DIR || '/var/lib/hermosskills';

export function buildFulfillmentTask(session, event = {}) {
  const metadata = session?.metadata && typeof session.metadata === 'object' ? session.metadata : {};
  const customerEmail = String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase();
  const amountTotal = typeof session?.amount_total === 'number' ? session.amount_total : null;
  const currency = String(session?.currency || '').toLowerCase();
  const plan = String(metadata.plan || session?.mode || 'unknown').slice(0, 80);
  const eventId = String(event?.id || '').slice(0, 120);
  const sessionId = String(session?.id || '').slice(0, 120);

  return {
    id: `hs_fulfill_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    source: 'stripe.checkout.session.completed',
    status: 'needs_human_review',
    priority: amountTotal && amountTotal >= 50000 ? 'high' : 'normal',
    event_id: eventId,
    checkout_session_id: sessionId,
    customer_email: customerEmail,
    plan,
    mode: String(session?.mode || '').slice(0, 40),
    amount_total: amountTotal,
    currency,
    next_actions: [
      'Verify Stripe payment in dashboard before starting work.',
      'Create or update the customer record without exposing private data in chat.',
      'Send Pete an approval-gated fulfillment draft: thank-you, scope-confirmation, and first next step.',
      'Do not perform outbound customer email until Pete approves the exact message.'
    ]
  };
}

export async function recordCheckoutFulfillment(session, event = {}, options = {}) {
  const repoDir = options.repoDir || __dirname;
  const dataDir = options.dataDir || fulfillmentDataDir;
  await fs.mkdir(path.join(repoDir, 'orders'), { recursive: true });
  await fs.appendFile(path.join(repoDir, 'orders/stripe-checkouts.jsonl'), JSON.stringify(session) + '\n');

  await fs.mkdir(dataDir, { recursive: true });
  const task = buildFulfillmentTask(session, event);
  await fs.appendFile(path.join(dataDir, 'fulfillment-tasks.jsonl'), JSON.stringify(task) + '\n', 'utf8');
  await fs.appendFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), JSON.stringify({
    created_at: task.created_at,
    level: 'action_required',
    message: `Hermosskills checkout completed: ${task.plan} ${task.amount_total ?? 'unknown'} ${task.currency || ''}. Human fulfillment review required.`,
    task_id: task.id,
    checkout_session_id: task.checkout_session_id
  }) + '\n', 'utf8');
  return task;
}

export function buildOperatorLeadTask(lead) {
  const fitScore = typeof lead?.fit_score === 'number' ? lead.fit_score : null;
  const email = String(lead?.email || '').trim().toLowerCase();
  const budget = String(lead?.budget || '').slice(0, 20);
  const url = String(lead?.url || '').slice(0, 500);

  return {
    id: `hs_operator_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    source: 'operator-interest',
    status: 'needs_human_review',
    priority: fitScore !== null && fitScore >= 75 ? 'high' : 'normal',
    lead_id: String(lead?.id || '').slice(0, 120),
    customer_email: email,
    url,
    budget,
    fit_score: fitScore,
    fit_band: String(lead?.fit_band || '').slice(0, 80),
    next_actions: [
      'Review the lead against the live site and fit score before replying.',
      'Draft a short approval-gated fit-call invitation only if the lead is high-fit.',
      'Do not send outbound email until Pete approves the exact message.',
      'If the lead is low-fit, prepare a polite decline or prep-first note rather than pushing a sale.'
    ]
  };
}

export async function recordOperatorLeadTask(lead, options = {}) {
  const dataDir = options.dataDir || fulfillmentDataDir;
  await fs.mkdir(dataDir, { recursive: true });
  const task = buildOperatorLeadTask(lead);
  await fs.appendFile(path.join(dataDir, 'operator-lead-tasks.jsonl'), JSON.stringify(task) + '\n', 'utf8');
  await fs.appendFile(path.join(dataDir, 'fulfillment-alerts.jsonl'), JSON.stringify({
    created_at: task.created_at,
    level: task.priority === 'high' ? 'action_required' : 'review',
    message: `Hermosskills operator lead: score ${task.fit_score ?? 'unknown'} (${task.fit_band || 'unbanded'}). Human review required before any reply.`,
    task_id: task.id,
    lead_id: task.lead_id
  }) + '\n', 'utf8');
  return task;
}

const testLeadDomains = new Set(['example.com', 'example.org', 'example.net', 'y.com', 'z.com', 'test.com', 'localhost']);

export function isLikelyTestOperatorLead(lead) {
  const email = String(lead?.email || '').trim().toLowerCase();
  const name = String(lead?.name || '').trim().toLowerCase();
  const urlText = String(lead?.url || '').trim().toLowerCase();
  let urlHost = '';
  try { urlHost = new URL(urlText).hostname.replace(/^www\./, ''); } catch { /* ignore malformed URL */ }
  const emailDomain = email.includes('@') ? email.split('@').pop() : '';
  if (testLeadDomains.has(emailDomain) || testLeadDomains.has(urlHost)) return true;
  if (/^(test|testing|x|final|demo|sample|asdf|qwerty)$/.test(name)) return true;
  if (/^(test|demo|sample|x)(\+[^@]+)?@/.test(email)) return true;
  return false;
}

export function buildOperatorLeadStats(leads) {
  const raw_count = leads.length;
  const realLeads = leads.filter((lead) => !isLikelyTestOperatorLead(lead));
  const scores = realLeads
    .map((lead) => lead.fit_score)
    .filter((score) => typeof score === 'number' && Number.isFinite(score));
  const avg_fit_score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  return {
    ok: true,
    count: realLeads.length,
    raw_count,
    excluded_test_count: raw_count - realLeads.length,
    avg_fit_score
  };
}

const plans = {
  sponsor: {
    mode: 'subscription',
    name: 'Hermosskills Skill Sponsor',
    amount: 4900,
    interval: 'month',
    description: 'Monthly sponsorship for maintenance of a curated AI-agent skill.',
    priceId: process.env.HERMOSSKILLS_SPONSOR_PRICE_ID || ''
  },
  founding: {
    mode: 'subscription',
    name: 'Hermosskills Founding Sponsor',
    amount: 25000,
    interval: 'month',
    description: 'Founding monthly sponsorship for the Hermosskills public-good AI skill catalog.',
    priceId: process.env.HERMOSSKILLS_FOUNDING_PRICE_ID || ''
  },
  commission: {
    mode: 'payment',
    name: 'Custom Skill Commission Deposit',
    amount: 50000,
    description: 'Deposit toward a scoped custom AI-agent skill, integration, or audit.',
    priceId: process.env.HERMOSSKILLS_COMMISSION_PRICE_ID || ''
  }
};

app.use((req, res, next) => {
  if (req.path === '/api/stripe-webhook') return next();
  express.json({ limit: '128kb' })(req, res, next);
});
app.use(express.static(__dirname, { extensions: ['html'] }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripe), publicBaseUrl });
});


app.post('/api/operator-interest', async (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim().slice(0, 120);
    const url = String(body.url || '').trim().slice(0, 500);
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required.' });
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Live https URL required.' });
    }
    if (!body.consent) {
      return res.status(400).json({ error: 'Consent required.' });
    }
    const lead = {
      id: `oaas_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      received_at: new Date().toISOString(),
      name,
      email,
      url,
      stripe: String(body.stripe || '').slice(0, 40),
      budget: String(body.budget || '').slice(0, 20),
      bottleneck: String(body.bottleneck || '').slice(0, 40),
      hours: String(body.hours || '').slice(0, 20),
      goal: String(body.goal || '').trim().slice(0, 600),
      fit_score: Number(body.fit_score) || null,
      fit_band: String(body.fit_band || '').slice(0, 80),
      utm: body.utm && typeof body.utm === 'object' ? body.utm : {},
      page: String(body.page || '').slice(0, 500),
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      ua: String(req.headers['user-agent'] || '').slice(0, 240)
    };
    const dir = '/var/lib/hermosskills';
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'operator-leads.jsonl');
    await fs.appendFile(file, JSON.stringify(lead) + '\n', 'utf8');
    const task = await recordOperatorLeadTask(lead, { dataDir: dir });
    res.json({
      ok: true,
      id: lead.id,
      task_id: task.id,
      fit_score: lead.fit_score,
      message: 'Application received. We review fit scores and reply only when a pilot makes sense.'
    });
  } catch (err) {
    console.error('operator-interest', err);
    res.status(500).json({ error: 'Could not save application. Email team@hermosskills.com.' });
  }
});

app.get('/api/operator-interest/stats', async (_req, res) => {
  try {
    const file = path.join('/var/lib/hermosskills', 'operator-leads.jsonl');
    let text = '';
    try { text = await fs.readFile(file, 'utf8'); } catch { /* empty */ }
    const leads = text.split('\n').filter(Boolean).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.json(buildOperatorLeadStats(leads));
  } catch (err) {
    res.status(500).json({ error: 'stats unavailable' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Secure checkout is temporarily unavailable. Please email team@hermosskills.com and we will help.' });
    const planKey = String(req.body?.plan || '').toLowerCase();
    const plan = plans[planKey];
    if (!plan) return res.status(400).json({ error: 'Unknown checkout option.' });
    const email = String(req.body?.email || '').trim();
    const note = String(req.body?.note || '').trim().slice(0, 400);
    const price_data = {
      currency: 'usd',
      unit_amount: plan.amount,
      product_data: { name: plan.name, description: plan.description }
    };
    if (plan.mode === 'subscription') price_data.recurring = { interval: plan.interval };
    const lineItem = plan.priceId ? { quantity: 1, price: plan.priceId } : { quantity: 1, price_data };
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      line_items: [lineItem],
      customer_email: email && /@/.test(email) ? email : undefined,
      success_url: `${publicBaseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicBaseUrl}/?checkout=canceled#commission`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: { message: plan.mode === 'subscription' ? 'You can manage or cancel sponsorship by contacting team@hermosskills.com.' : 'After payment, we will email you to scope the custom skill work.' }
      },
      metadata: { plan: planKey, note }
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('checkout error', error);
    res.status(500).json({ error: error.message || 'Unable to create checkout session.' });
  }
});

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe || !stripeWebhookSecret) return res.status(204).send();
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    if (event.type === 'checkout.session.completed') {
      await recordCheckoutFulfillment(event.data.object, event);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('webhook error', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, '127.0.0.1', () => {
    console.log(`hermosskills server listening on http://127.0.0.1:${port}`);
  });
}

export { app };
