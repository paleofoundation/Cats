module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey) return res.status(503).json({ error: 'Secure checkout is not configured.' })
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  return res.status(200).json({ publishableKey })
}
