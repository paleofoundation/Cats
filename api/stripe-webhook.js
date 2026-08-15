const Stripe = require('stripe');
const { database, ensureSchema, recordDonation } = require('./_db');

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

    await ensureSchema();
    const sql = database();
    const alreadyProcessed = await sql`SELECT event_id FROM garden_stripe_events WHERE event_id = ${event.id} LIMIT 1`;
    if (alreadyProcessed.length) return res.status(200).json({ received: true, duplicate: true });

    if (event.type === 'checkout.session.completed') {
      await recordDonation(event.data.object);
    }
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.parent?.subscription_details?.subscription;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await recordDonation({
          id: `invoice:${invoice.id}`,
          status: 'complete',
          payment_status: 'paid',
          amount_total: invoice.amount_paid,
          currency: invoice.currency,
          customer: typeof invoice.customer === 'string' ? invoice.customer : null,
          metadata: subscription.metadata,
        });
      }
    }

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
