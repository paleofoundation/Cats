const { database, ensureSchema } = require('./_db')

const CAT_ID_PATTERN = /^[a-z0-9-]{1,60}$/

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await ensureSchema()
    const sql = database()
    const requestedCat = typeof req.query?.cat === 'string' && CAT_ID_PATTERN.test(req.query.cat)
      ? req.query.cat
      : 'splotch'

    const cats = await sql`
      SELECT cat_id, name, summary, difficulty, life_status, profile_path, updated_at
      FROM garden_cats
      WHERE public = TRUE AND (cat_id = ${requestedCat} OR cat_id = 'mabel')
      ORDER BY CASE WHEN cat_id = ${requestedCat} THEN 0 ELSE 1 END, name
    `
    const needs = await sql`
      SELECT
        n.need_id, n.cat_id, n.program, n.title, n.detail, n.goal_cents, n.suggested_cents,
        n.currency, n.status, n.fulfillment_status, n.overflow_policy, n.updated_at,
        COALESCE(SUM(d.amount_cents) FILTER (WHERE d.payment_status = 'paid'), 0)::bigint AS received_cents,
        COALESCE(SUM(a.amount_cents) FILTER (WHERE a.status = 'pending_sanctuary_review'), 0)::bigint AS pending_cents,
        COALESCE(SUM(a.amount_cents) FILTER (WHERE a.status IN ('allocated', 'fulfilled')), 0)::bigint AS allocated_cents
      FROM garden_care_needs n
      LEFT JOIN garden_donations d ON d.need_id = n.need_id
      LEFT JOIN garden_donation_allocations a ON a.session_id = d.session_id AND a.need_id = n.need_id
      WHERE n.public = TRUE AND (n.cat_id = ${requestedCat} OR (n.cat_id IS NULL AND n.program = 'sanctuary'))
      GROUP BY n.need_id
      ORDER BY
        CASE n.status WHEN 'open' THEN 0 WHEN 'review' THEN 1 WHEN 'proposed' THEN 2 ELSE 3 END,
        n.created_at
    `
    const events = await sql`
      SELECT event_id, event_key, event_type, cat_id, need_id, title, detail, metadata, occurred_at
      FROM garden_care_events
      WHERE public = TRUE AND (cat_id = ${requestedCat} OR cat_id IS NULL)
      ORDER BY occurred_at DESC
      LIMIT 24
    `
    const proofs = await sql`
      SELECT proof_id, proof_key, event_id, need_id, cat_id, kind, title, url, source, redacted, published_at, verified_by
      FROM garden_proof_assets
      WHERE public = TRUE AND (cat_id = ${requestedCat} OR cat_id IS NULL)
      ORDER BY published_at DESC NULLS LAST, proof_id DESC
      LIMIT 24
    `

    const toNumber = (value) => value === null ? null : Number(value)
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120')
    return res.status(200).json({
      asOf: new Date().toISOString(),
      catId: requestedCat,
      cats,
      needs: needs.map((need) => ({
        ...need,
        goal_cents: toNumber(need.goal_cents),
        suggested_cents: toNumber(need.suggested_cents),
        received_cents: toNumber(need.received_cents),
        pending_cents: toNumber(need.pending_cents),
        allocated_cents: toNumber(need.allocated_cents),
      })),
      events,
      proofs,
      worldArtifacts: events
        .map((event) => event.metadata?.world_artifact)
        .filter((artifact) => typeof artifact === 'string'),
      truthBoundary: {
        virtual: 'Virtual tokens remain game currency.',
        real: 'Real money is never represented as fictional currency or treated as something the player spent on an imaginary object.',
      },
    })
  } catch (error) {
    console.error('Reality thread request failed', error?.message || error)
    return res.status(503).json({ error: 'The live sanctuary record is temporarily unavailable.' })
  }
}
