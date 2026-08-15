const Stripe = require('stripe')
const { authenticateGardenRequest } = require('./_auth')
const { recordDonation } = require('./_db')

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Donation verification is not configured.' })
  const sessionId = typeof req.query?.session_id === 'string' ? req.query.session_id : ''
  if (!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'Invalid donation session.' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const verified = session.status === 'complete' && session.payment_status === 'paid'
    const account = await authenticateGardenRequest(req, { optional: true })
    const sessionUserId = session.metadata?.app_user_id || ''
    if (sessionUserId && account?.userId !== sessionUserId) return res.status(403).json({ error: 'This donation belongs to a different garden account.' })
    if (verified) await recordDonation(session)
    return res.status(verified ? 200 : 202).json({
      verified,
      amount: verified ? (session.amount_total || 0) / 100 : 0,
      badge: verified ? session.metadata?.badge || null : null,
      needId: verified ? session.metadata?.need_id || null : null,
    })
  } catch (error) {
    console.error('Unable to verify Stripe Checkout Session', error?.message || error)
    return res.status(400).json({ error: 'Unable to verify this donation session.' })
  }
}
