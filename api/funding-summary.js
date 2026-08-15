const { database, ensureSchema } = require('./_db')

const PUBLIC_CAMPAIGNS = new Set(['tv-pilot', 'tv-operations', 'gabriel-trust', 'fluff-care'])

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await ensureSchema()
    const sql = database()
    const rows = await sql`
      SELECT need_id,
             COALESCE(SUM(amount_cents), 0)::bigint AS total_cents,
             COUNT(*)::integer AS gift_count,
             MAX(created_at) AS last_funded_at
      FROM garden_donations
      WHERE payment_status = 'paid' AND need_id IS NOT NULL
      GROUP BY need_id
    `
    const campaigns = {}
    for (const row of rows) {
      if (!PUBLIC_CAMPAIGNS.has(row.need_id)) continue
      campaigns[row.need_id] = {
        total: Number(row.total_cents || 0) / 100,
        gifts: Number(row.gift_count || 0),
        lastFundedAt: row.last_funded_at || null,
      }
    }
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ campaigns, currency: 'USD' })
  } catch (error) {
    console.error('Funding summary request failed', error?.message || error)
    return res.status(503).json({ error: 'Verified funding totals are temporarily unavailable.' })
  }
}
