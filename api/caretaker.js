const { randomUUID } = require('crypto')
const { authenticateCaretaker } = require('./_caretaker')
const { database, ensureSchema } = require('./_db')

const EVENT_TYPES = new Set([
  'care.completed',
  'dispatch.published',
  'item.ordered',
  'need.funded',
  'proof.published',
  'sanctuary.update',
  'need.updated',
  'cat.updated',
  'funds.allocated',
])
const NEED_STATUSES = new Set(['open', 'review', 'proposed', 'funded', 'fulfilled', 'paused', 'archived'])
const FULFILLMENT_STATUSES = new Set(['published', 'funding', 'funded', 'ordered', 'in_progress', 'verified'])
const PROOF_KINDS = new Set(['photo', 'video', 'receipt', 'vet-note', 'document', 'livestream'])
const ALLOCATION_STATUSES = new Set(['pending_sanctuary_review', 'allocated', 'fulfilled', 'refunded'])
const PARTICIPATION_STATUSES = new Set(['new', 'reviewing', 'contacted', 'scheduled', 'closed'])
const ID_PATTERN = /^[a-z0-9-]{1,80}$/

function safeText(value, maximum = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function safeUrl(value) {
  const url = safeText(value, 1000)
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

async function publishNotification(sql, { eventId, catId, title, body, actionUrl }) {
  await sql`
    INSERT INTO garden_notifications (event_id, cat_id, title, body, action_url)
    SELECT ${eventId}, ${catId || null}, ${title}, ${body}, ${actionUrl || '/'}
    WHERE NOT EXISTS (
      SELECT 1 FROM garden_notifications WHERE event_id = ${eventId} AND user_id IS NULL
    )
  `
}

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const caretaker = await authenticateCaretaker(req)
    await ensureSchema()
    const sql = database()

    if (req.method === 'GET') {
      const [needs, events, proofs, donations, participationRequests] = await Promise.all([
        sql`SELECT * FROM garden_care_needs ORDER BY updated_at DESC, created_at DESC`,
        sql`SELECT * FROM garden_care_events ORDER BY occurred_at DESC LIMIT 80`,
        sql`SELECT * FROM garden_proof_assets ORDER BY published_at DESC NULLS LAST, proof_id DESC LIMIT 80`,
        sql`
          SELECT d.session_id, d.user_id, d.amount_cents, d.currency, d.need_id, d.cat_id, d.program,
                 d.donor_name, d.allocation_status, d.created_at,
                 a.allocation_id, a.amount_cents AS allocated_amount_cents, a.status AS allocation_record_status, a.note
          FROM garden_donations d
          LEFT JOIN garden_donation_allocations a ON a.session_id = d.session_id
          WHERE d.payment_status = 'paid'
          ORDER BY d.created_at DESC
          LIMIT 100
        `,
        sql`SELECT * FROM garden_participation_requests ORDER BY created_at DESC LIMIT 100`,
      ])
      return res.status(200).json({ caretaker, needs, events, proofs, donations, participationRequests })
    }

    const action = safeText(req.body?.action, 80)
    if (action === 'update_need') {
      const needId = safeText(req.body?.needId, 80)
      if (!ID_PATTERN.test(needId)) return res.status(400).json({ error: 'Invalid need.' })
      const current = (await sql`SELECT * FROM garden_care_needs WHERE need_id = ${needId} LIMIT 1`)[0]
      if (!current) return res.status(404).json({ error: 'Need not found.' })
      const title = safeText(req.body?.title, 120) || current.title
      const detail = safeText(req.body?.detail, 1200) || current.detail
      const overflowPolicy = safeText(req.body?.overflowPolicy, 1200) || current.overflow_policy
      const status = NEED_STATUSES.has(req.body?.status) ? req.body.status : current.status
      const fulfillmentStatus = FULFILLMENT_STATUSES.has(req.body?.fulfillmentStatus) ? req.body.fulfillmentStatus : current.fulfillment_status
      const goalCents = req.body?.goalCents === null
        ? null
        : Number.isSafeInteger(Number(req.body?.goalCents)) && Number(req.body.goalCents) >= 0
          ? Number(req.body.goalCents)
          : current.goal_cents
      await sql`
        UPDATE garden_care_needs SET
          title = ${title}, detail = ${detail}, overflow_policy = ${overflowPolicy}, status = ${status},
          fulfillment_status = ${fulfillmentStatus}, goal_cents = ${goalCents}, updated_at = NOW()
        WHERE need_id = ${needId}
      `
      return res.status(200).json({ saved: true })
    }

    if (action === 'review_allocation') {
      const sessionId = safeText(req.body?.sessionId, 200)
      const needId = safeText(req.body?.needId, 80)
      const status = ALLOCATION_STATUSES.has(req.body?.status) ? req.body.status : 'allocated'
      if (!sessionId || !ID_PATTERN.test(needId)) return res.status(400).json({ error: 'Donation and need are required.' })
      const donation = (await sql`SELECT * FROM garden_donations WHERE session_id = ${sessionId} LIMIT 1`)[0]
      const need = (await sql`SELECT need_id, title, cat_id FROM garden_care_needs WHERE need_id = ${needId} LIMIT 1`)[0]
      if (!donation || !need) return res.status(404).json({ error: 'Donation or need not found.' })
      const amountCents = Number.isSafeInteger(Number(req.body?.amountCents)) && Number(req.body.amountCents) > 0
        ? Number(req.body.amountCents)
        : Number(donation.amount_cents)
      if (amountCents > Number(donation.amount_cents)) return res.status(400).json({ error: 'Allocation exceeds the verified gift.' })
      await sql`DELETE FROM garden_donation_allocations WHERE session_id = ${sessionId}`
      await sql`
        INSERT INTO garden_donation_allocations (session_id, need_id, amount_cents, status, note, allocated_by)
        VALUES (${sessionId}, ${needId}, ${amountCents}, ${status}, ${safeText(req.body?.note, 500) || null}, ${caretaker.userId})
      `
      await sql`
        UPDATE garden_donations SET need_id = ${needId}, cat_id = COALESCE(${need.cat_id}, cat_id), allocation_status = ${status}
        WHERE session_id = ${sessionId}
      `
      const eventRows = await sql`
        INSERT INTO garden_care_events (
          event_key, event_type, cat_id, need_id, user_id, title, detail, metadata, public, created_by
        ) VALUES (
          ${`allocation:${sessionId}`}, 'funds.allocated', ${need.cat_id}, ${needId}, ${donation.user_id},
          'Your contribution was allocated', ${`The sanctuary allocated this verified gift to ${need.title}.`},
          ${JSON.stringify({ amount_cents: amountCents, currency: donation.currency, allocation_status: status })}::jsonb,
          FALSE, ${caretaker.userId}
        )
        ON CONFLICT (event_key) DO UPDATE SET detail = EXCLUDED.detail, metadata = EXCLUDED.metadata
        RETURNING event_id
      `
      if (donation.user_id && eventRows[0]) {
        await sql`
          INSERT INTO garden_notifications (event_id, user_id, cat_id, title, body, action_url)
          SELECT ${eventRows[0].event_id}, ${donation.user_id}, ${need.cat_id}, 'Your real gift has an allocation', ${`It is now recorded under ${need.title}.`}, '/?profile=open'
          WHERE NOT EXISTS (SELECT 1 FROM garden_notifications WHERE event_id = ${eventRows[0].event_id} AND user_id = ${donation.user_id})
        `
      }
      return res.status(200).json({ allocated: true })
    }

    if (action === 'review_participation') {
      const requestId = Number(req.body?.requestId)
      const status = PARTICIPATION_STATUSES.has(req.body?.status) ? req.body.status : ''
      if (!Number.isSafeInteger(requestId) || requestId <= 0 || !status) return res.status(400).json({ error: 'Request and review status are required.' })
      const rows = await sql`
        UPDATE garden_participation_requests SET status = ${status}
        WHERE request_id = ${requestId}
        RETURNING request_id
      `
      if (!rows.length) return res.status(404).json({ error: 'Participation request not found.' })
      return res.status(200).json({ reviewed: true })
    }

    if (action === 'publish_event') {
      const eventType = EVENT_TYPES.has(req.body?.eventType) ? req.body.eventType : ''
      const catId = safeText(req.body?.catId, 80) || null
      const needId = safeText(req.body?.needId, 80) || null
      const title = safeText(req.body?.title, 160)
      const detail = safeText(req.body?.detail, 1600)
      if (!eventType || !title || !detail) return res.status(400).json({ error: 'Event type, title, and detail are required.' })
      if (catId && !ID_PATTERN.test(catId)) return res.status(400).json({ error: 'Invalid cat.' })
      if (needId && !ID_PATTERN.test(needId)) return res.status(400).json({ error: 'Invalid need.' })
      const worldArtifact = safeText(req.body?.worldArtifact, 80)
      const rows = await sql`
        INSERT INTO garden_care_events (
          event_key, event_type, cat_id, need_id, title, detail, metadata, public, created_by
        ) VALUES (
          ${`caretaker:${randomUUID()}`}, ${eventType}, ${catId}, ${needId}, ${title}, ${detail},
          ${JSON.stringify(worldArtifact ? { world_artifact: worldArtifact } : {})}::jsonb,
          ${Boolean(req.body?.public)}, ${caretaker.userId}
        )
        RETURNING event_id
      `
      if (Boolean(req.body?.public) && rows[0]) {
        await publishNotification(sql, { eventId: rows[0].event_id, catId, title, body: detail, actionUrl: catId ? `/${catId === 'splotch' ? 'Splotch' : catId === 'mabel' ? 'Mabel' : 'cats'}` : '/' })
      }
      return res.status(200).json({ published: true, eventId: Number(rows[0]?.event_id || 0) })
    }

    if (action === 'publish_proof') {
      const eventId = Number(req.body?.eventId)
      const catId = safeText(req.body?.catId, 80) || null
      const needId = safeText(req.body?.needId, 80) || null
      const kind = PROOF_KINDS.has(req.body?.kind) ? req.body.kind : ''
      const title = safeText(req.body?.title, 160)
      const url = safeUrl(req.body?.url)
      if (!Number.isSafeInteger(eventId) || eventId <= 0 || !kind || !title || !url) {
        return res.status(400).json({ error: 'Event, proof type, title, and a secure URL are required.' })
      }
      const event = (await sql`SELECT event_id, cat_id, need_id, title, detail FROM garden_care_events WHERE event_id = ${eventId} LIMIT 1`)[0]
      if (!event) return res.status(404).json({ error: 'Care event not found.' })
      const resolvedCatId = catId || event.cat_id || null
      const resolvedNeedId = needId || event.need_id || null
      await sql`
        INSERT INTO garden_proof_assets (
          proof_key, event_id, need_id, cat_id, kind, title, url, source, redacted, public, published_at, verified_by
        ) VALUES (
          ${`proof:${randomUUID()}`}, ${eventId}, ${resolvedNeedId}, ${resolvedCatId}, ${kind}, ${title}, ${url},
          ${safeText(req.body?.source, 160) || 'Sanctuary record'}, ${Boolean(req.body?.redacted)},
          ${Boolean(req.body?.public)}, CASE WHEN ${Boolean(req.body?.public)} THEN NOW() ELSE NULL END, ${caretaker.userId}
        )
      `
      if (Boolean(req.body?.public)) {
        await sql`UPDATE garden_care_events SET public = TRUE WHERE event_id = ${eventId}`
        await publishNotification(sql, {
          eventId,
          catId: resolvedCatId,
          title: event.title,
          body: event.detail,
          actionUrl: resolvedCatId === 'splotch' ? '/Splotch' : resolvedCatId === 'mabel' ? '/Mabel' : '/cats',
        })
      }
      return res.status(200).json({ published: true })
    }

    return res.status(400).json({ error: 'Unknown caretaker action.' })
  } catch (error) {
    const statusCode = error?.statusCode || 500
    if (statusCode >= 500) console.error('Caretaker request failed', error?.message || error)
    return res.status(statusCode).json({ error: error?.message || 'Unable to update the sanctuary record.' })
  }
}
