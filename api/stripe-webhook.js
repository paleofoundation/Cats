const Stripe = require('stripe');
const { database, ensureSchema, recordDonation } = require('./_db');
const { isCatGardensDonation, stripeLiveMode } = require('./_payment-scope');

module.exports.config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook environment variables are not configured');
    return res.status(500).send('Webhook is not configured');
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' });
    const event = stripe.webhooks.constructEvent(
      await readRawBody(req),
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.livemode !== stripeLiveMode()) return res.status(400).send('Stripe mode mismatch');
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'invoice.paid'].includes(event.type)) {
      return res.status(200).json({ received: true, ignored: true });
    }
    let donation;
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.parent?.subscription_details?.subscription;
      if (!subscriptionId || invoice.status !== 'paid' || invoice.amount_paid <= 0) return res.status(200).json({ received: true, ignored: true });
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!isCatGardensDonation(subscription)) return res.status(200).json({ received: true, ignored: true });
      donation = {
        id: `invoice:${invoice.id}`, status: 'complete', payment_status: 'paid',
        livemode: event.livemode, amount_total: invoice.amount_paid, currency: invoice.currency,
        customer: typeof invoice.customer === 'string' ? invoice.customer : null,
        metadata: subscription.metadata,
      };
    } else {
      donation = event.data.object;
      if (!isCatGardensDonation(donation)) return res.status(200).json({ received: true, ignored: true });
    }

    await ensureSchema();
    const sql = database();
    const alreadyProcessed = await sql`SELECT event_id FROM garden_stripe_events WHERE event_id = ${event.id} LIMIT 1`;
    if (alreadyProcessed.length) return res.status(200).json({ received: true, duplicate: true });

    await recordDonation(donation);

    await sql`
      INSERT INTO garden_stripe_events (event_id, event_type)
      VALUES (${event.id}, ${event.type})
      ON CONFLICT (event_id) DO NOTHING
    `;

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook verification failed', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
