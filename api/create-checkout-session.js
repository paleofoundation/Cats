const Stripe = require('stripe');

const MINIMUM_AMOUNT_CENTS = 500;
const MAXIMUM_AMOUNT_CENTS = 50000000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Payments are temporarily unavailable.' });
  }

  try {
    const { amount, frequency, campaign, email, firstName, lastName } = req.body || {};
    const amountCents = Math.round(Number(amount) * 100);
    const isMonthly = frequency === 'monthly';

    if (!Number.isSafeInteger(amountCents) || amountCents < MINIMUM_AMOUNT_CENTS || amountCents > MAXIMUM_AMOUNT_CENTS) {
      return res.status(400).json({ error: 'Donation amount must be between $5 and $500,000.' });
    }
    if (!['once', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'Invalid donation frequency.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const safeCampaign = typeof campaign === 'string'
      ? campaign.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 100)
      : '';
    const donorName = [firstName, lastName]
      .filter(value => typeof value === 'string')
      .map(value => value.trim().slice(0, 100))
      .filter(Boolean)
      .join(' ');
    const siteUrl = (process.env.SITE_URL || 'https://gardensofstgertrude.org').replace(/\/$/, '');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: isMonthly ? 'subscription' : 'payment',
      customer_email: email,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: isMonthly ? 'Monthly donation' : 'Donation',
            description: safeCampaign
              ? `Gardens of St. Gertrude — ${safeCampaign}`
              : 'Gardens of St. Gertrude cat sanctuary'
          },
          ...(isMonthly ? { recurring: { interval: 'month' } } : {})
        }
      }],
      metadata: {
        campaign: safeCampaign || 'general',
        donor_name: donorName,
        donation_frequency: frequency
      },
      subscription_data: isMonthly ? {
        metadata: { campaign: safeCampaign || 'general', donor_name: donorName }
      } : undefined,
      payment_intent_data: isMonthly ? undefined : {
        metadata: { campaign: safeCampaign || 'general', donor_name: donorName }
      },
      success_url: `${siteUrl}/donation-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout.html?amount=${(amountCents / 100).toFixed(2)}&frequency=${frequency}${safeCampaign ? `&campaign=${encodeURIComponent(safeCampaign)}` : ''}`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Unable to create Stripe Checkout Session', error);
    return res.status(500).json({ error: 'Unable to start secure checkout. Please try again.' });
  }
};
