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
    res.json({
      ok: true,
      id: lead.id,
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
    const lines = text.split('\n').filter(Boolean);
    const scores = lines.map((l) => {
      try { return JSON.parse(l).fit_score; } catch { return null; }
    }).filter((n) => typeof n === 'number');
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    res.json({ ok: true, count: lines.length, avg_fit_score: avg });
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
      await fs.mkdir(path.join(__dirname, 'orders'), { recursive: true });
      await fs.appendFile(path.join(__dirname, 'orders/stripe-checkouts.jsonl'), JSON.stringify(event.data.object) + '\n');
    }
    res.json({ received: true });
  } catch (error) {
    console.error('webhook error', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`hermosskills server listening on http://127.0.0.1:${port}`);
});
