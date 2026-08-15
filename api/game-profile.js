const { authenticateGardenRequest } = require('./_auth')
const { database, ensureSchema } = require('./_db')

const STRING_ARRAY_FIELDS = ['foodFound', 'partsFound', 'dreamDiscoveries']
const BOOLEAN_FIELDS = ['started', 'hasFed', 'hasBonded']
const NUMBER_LIMITS = {
  food: [0, 20],
  parts: [0, 20],
  hunger: [0, 100],
  trust: [0, 100],
  safety: [0, 100],
  carePoints: [0, 10000000],
  shelterStage: [0, 4],
  bondVisits: [0, 6],
  realityVisits: [0, 100000],
  dreamVisits: [0, 100000],
  lastBondAt: [0, Number.MAX_SAFE_INTEGER],
}

function sanitizeState(input) {
  const source = input && typeof input === 'object' ? input : {}
  const state = {}
  for (const field of STRING_ARRAY_FIELDS) {
    if (Array.isArray(source[field])) state[field] = [...new Set(source[field].filter((value) => typeof value === 'string').map((value) => value.slice(0, 80)))].slice(0, 100)
  }
  for (const field of BOOLEAN_FIELDS) if (typeof source[field] === 'boolean') state[field] = source[field]
  for (const [field, [minimum, maximum]] of Object.entries(NUMBER_LIMITS)) {
    if (source[field] === null && field === 'lastBondAt') state[field] = null
    else if (Number.isFinite(source[field])) state[field] = Math.max(minimum, Math.min(maximum, Math.round(source[field])))
  }
  return state
}

module.exports = async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const account = await authenticateGardenRequest(req)
    await ensureSchema()
    const sql = database()

    if (req.method === 'PUT') {
      const state = sanitizeState(req.body?.state)
      const email = typeof req.body?.email === 'string' ? req.body.email.slice(0, 254) : null
      const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.slice(0, 100) : null
      await sql`
        INSERT INTO garden_profiles (user_id, email, display_name, state, updated_at)
        VALUES (${account.userId}, ${email}, ${displayName}, ${JSON.stringify(state)}::jsonb, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, garden_profiles.email),
          display_name = COALESCE(EXCLUDED.display_name, garden_profiles.display_name),
          state = EXCLUDED.state,
          updated_at = NOW()
      `
      return res.status(200).json({ saved: true })
    }

    const profiles = await sql`SELECT state, updated_at FROM garden_profiles WHERE user_id = ${account.userId} LIMIT 1`
    const donations = await sql`
      SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total_cents,
             COALESCE(ARRAY_AGG(DISTINCT badge) FILTER (WHERE badge IS NOT NULL), ARRAY[]::text[]) AS badges
      FROM garden_donations WHERE user_id = ${account.userId}
    `
    return res.status(200).json({
      state: profiles[0]?.state || null,
      updatedAt: profiles[0]?.updated_at || null,
      verifiedDonationTotal: Number(donations[0]?.total_cents || 0) / 100,
      donationBadges: donations[0]?.badges || [],
    })
  } catch (error) {
    console.error('Garden profile request failed', error?.message || error)
    return res.status(error?.statusCode || (String(error?.message).includes('database') ? 503 : 500)).json({ error: error?.message || 'Unable to load the garden profile.' })
  }
}
