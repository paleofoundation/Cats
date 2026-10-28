const { authorizedBridge, publicCareUpdate } = require('./_care-bridge')
const { database, ensureSchema } = require('./_db')
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  if (!process.env.CARE_BRIDGE_SECRET || process.env.CARE_BRIDGE_SECRET.length < 32) return res.status(503).json({ error: 'Care integration is not configured.' })
  if (!authorizedBridge(req.headers.authorization, process.env.CARE_BRIDGE_SECRET)) return res.status(401).json({ error: 'Service authentication required.' })
  let update
  try { update = publicCareUpdate(req.body) } catch (error) { return res.status(400).json({ error: error.message }) }
  try {
    await ensureSchema(); const sql = database()
    if (update.catId) {
      const cats = await sql`SELECT cat_id FROM garden_cats WHERE cat_id=${update.catId} AND public=TRUE LIMIT 1`
      if (!cats.length) return res.status(400).json({ error: 'The public cat has not been mapped.' })
    }
    const key = `care:${update.id}`
    // The version guard makes retries idempotent and prevents a delayed delivery from republishing a withdrawn record.
    await sql`
      INSERT INTO garden_care_events(event_key,event_type,cat_id,title,detail,metadata,public,occurred_at,created_by)
      VALUES(${key},'sanctuary.update',${update.catId},${update.title},${update.detail},
        ${JSON.stringify({ source:'catgardens-care',source_version:update.version })}::jsonb,${update.state==='published'},${update.occurredAt},'care-bridge')
      ON CONFLICT(event_key) DO UPDATE SET cat_id=EXCLUDED.cat_id,title=EXCLUDED.title,detail=EXCLUDED.detail,
        metadata=EXCLUDED.metadata,public=EXCLUDED.public,occurred_at=EXCLUDED.occurred_at
      WHERE COALESCE((garden_care_events.metadata->>'source_version')::integer,0) < ${update.version}
    `
    const rows=await sql`SELECT event_id,metadata->>'source_version' AS version FROM garden_care_events WHERE event_key=${key} LIMIT 1`
    return res.status(200).json({ received:true,eventId:Number(rows[0].event_id),version:Number(rows[0].version) })
  } catch(error) { console.error('Care bridge delivery failed'); return res.status(503).json({ error:'The game could not record the approved update. Retry safely.' }) }
}
