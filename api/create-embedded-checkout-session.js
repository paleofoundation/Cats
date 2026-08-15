const Stripe = require('stripe')
const { randomBytes } = require('crypto')
const { authenticateGardenRequest } = require('./_auth')

const MINIMUM_AMOUNT_CENTS = 500
const MAXIMUM_AMOUNT_CENTS = 50000000
const NEEDS = new Set(['food', 'future-dental', 'petting', 'media', 'tracker', 'mathikoloni', 'tv-pilot', 'tv-operations', 'gabriel-trust', 'fluff-care'])
const BADGES = new Set(['bowl-bringer', 'gentle-hands', 'storykeeper', 'bright-bite', 'safe-passage', 'dream-builder', 'garden-keeper', 'broadcast-builder', 'trust-keeper', 'fluff-crew'])
const CAT_IDS = new Set(['splotch', 'cat-gardens', 'gabriel', 'gabriel-and-poly'])
const PROGRAMS = new Set(['cat-care', 'cat-gardens-tv', 'sanctuary'])

function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  if (host && /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host)) return `${protocol}://${host}`
  return (process.env.SITE_URL || 'https://catgardens.org').replace(/\/$/, '')
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Secure checkout is not configured.' })

  try {
    const { amount, frequency, needId, needTitle, badge, email, donorName, catId, program } = req.body || {}
    const account = await authenticateGardenRequest(req, { optional: true })
    const amountCents = Math.round(Number(amount) * 100)
    const isMonthly = frequency === 'monthly'
    if (!Number.isSafeInteger(amountCents) || amountCents < MINIMUM_AMOUNT_CENTS || amountCents > MAXIMUM_AMOUNT_CENTS) {
      return res.status(400).json({ error: 'Donation amount must be between $5 and $500,000.' })
    }
    if (!['once', 'monthly'].includes(frequency)) return res.status(400).json({ error: 'Invalid donation frequency.' })
    if (!NEEDS.has(needId)) return res.status(400).json({ error: 'Unknown care need.' })
    if (!BADGES.has(badge)) return res.status(400).json({ error: 'Unknown supporter badge.' })
    const safeCatId = CAT_IDS.has(catId) ? catId : 'splotch'
    const safeProgram = PROGRAMS.has(program) ? program : 'cat-care'
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
      return res.status(400).json({ error: 'Invalid account email.' })
    }

    const safeTitle = typeof needTitle === 'string' ? needTitle.replace(/[<>]/g, '').slice(0, 100) : 'Splotch care'
    const safeName = typeof donorName === 'string' ? donorName.trim().slice(0, 100) : ''
    const safeUserId = account?.userId || ''
    const awardedBadge = isMonthly ? 'garden-keeper' : badge
    const origin = requestOrigin(req)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })
    const integrationIdentifier = `cat-gardens-${randomBytes(4).toString('hex')}`
    const sharedMetadata = {
      cat_id: safeCatId,
      need_id: needId,
      program: safeProgram,
      badge: awardedBadge,
      donation_frequency: frequency,
      donor_name: safeName,
      app_user_id: safeUserId,
      allocation_status: 'pending_sanctuary_review',
    }

    const session = await stripe.checkout.sessions.create({
      mode: isMonthly ? 'subscription' : 'payment',
      ui_mode: 'embedded',
      integration_identifier: integrationIdentifier,
      ...(email ? { customer_email: email } : {}),
      billing_address_collection: 'auto',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: isMonthly ? 'Monthly Cat Gardens donation' : 'Cat Gardens donation',
            description: `${safeCatId === 'cat-gardens' ? 'Cat Gardens TV' : safeCatId === 'gabriel-and-poly' ? 'Gabriel + Poly' : safeCatId.charAt(0).toUpperCase() + safeCatId.slice(1)} — ${safeTitle}`,
          },
          ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
        },
      }],
      metadata: sharedMetadata,
      subscription_data: isMonthly ? { metadata: sharedMetadata } : undefined,
      payment_intent_data: isMonthly ? undefined : { metadata: sharedMetadata },
      return_url: `${origin}/?donation=complete&session_id={CHECKOUT_SESSION_ID}`,
    })

    return res.status(200).json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('Unable to create embedded Stripe Checkout Session', error?.message || error)
    return res.status(500).json({ error: 'Unable to start secure checkout. Please try again.' })
  }
}
