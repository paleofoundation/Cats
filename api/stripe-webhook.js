const Stripe = require('stripe');

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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      await readRawBody(req),
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Stripe remains the system of record. These verified events are ready for
    // donor CRM, email, or fulfillment integrations when those are connected.
    if (['checkout.session.completed', 'invoice.paid', 'invoice.payment_failed', 'customer.subscription.deleted'].includes(event.type)) {
      console.log(`Verified Stripe event ${event.id}: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook verification failed', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
