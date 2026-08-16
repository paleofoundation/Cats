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
  'expense.paid',
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
      const [needs, events, proofs, donations, expenses, participationRequests] = await Promise.all([
        sql`SELECT * FROM garden_care_needs ORDER BY updated_at DESC, created_at DESC`,
        sql`SELECT * FROM garden_care_events ORDER BY occurred_at DESC LIMIT 80`,
        sql`SELECT * FROM garden_proof_assets ORDER BY published_at DESC NULLS LAST, proof_id DESC LIMIT 80`,
        sql`
          SELECT d.session_id, d.user_id, d.amount_cents, d.currency, d.need_id, d.cat_id, d.program,
                 d.donor_name, d.allocation_status, d.created_at,
                 a.allocation_id, a.amount_cents AS allocated_amount_cents, a.status AS allocation_record_status, a.note,
                 COALESCE(spent.spent_cents, 0)::bigint AS spent_cents
          FROM garden_donations d
          LEFT JOIN garden_donation_allocations a ON a.session_id = d.session_id
          LEFT JOIN LATERAL (
            SELECT COALESCE(SUM(f.amount_cents), 0)::bigint AS spent_cents
            FROM garden_expense_funding f WHERE f.allocation_id = a.allocation_id
          ) spent ON TRUE
          WHERE d.payment_status = 'paid'
          ORDER BY d.created_at DESC
          LIMIT 100
        `,
        sql`
          SELECT e.*, n.title AS need_title, c.name AS cat_name,
                 COALESCE(SUM(f.amount_cents), 0)::bigint AS linked_cents,
                 p.title AS proof_title, p.url AS proof_url
          FROM garden_sanctuary_expenses e
          LEFT JOIN garden_care_needs n ON n.need_id = e.need_id
          LEFT JOIN garden_cats c ON c.cat_id = e.cat_id
          LEFT JOIN garden_expense_funding f ON f.expense_id = e.expense_id
          LEFT JOIN garden_proof_assets p ON p.proof_id = e.proof_id
          GROUP BY e.expense_id, n.title, c.name, p.title, p.url
          ORDER BY e.paid_at DESC, e.expense_id DESC
          LIMIT 100
        `,
        sql`SELECT * FROM garden_participation_requests ORDER BY created_at DESC LIMIT 100`,
      ])
      return res.status(200).json({ caretaker, needs, events, proofs, donations, expenses, participationRequests })
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

    if (action === 'record_expense') {
      const needId = safeText(req.body?.needId, 80) || null
      const catId = safeText(req.body?.catId, 80) || null
      const title = safeText(req.body?.title, 160)
      const detail = safeText(req.body?.detail, 1600)
      const vendor = safeText(req.body?.vendor, 160) || null
      const currency = safeText(req.body?.currency, 3).toLowerCase() || 'usd'
      const amountCents = Number(req.body?.amountCents)
      const sessionId = safeText(req.body?.sessionId, 220) || null
      const fundedCents = sessionId ? Number(req.body?.fundedCents) : 0
      const paidAt = new Date(req.body?.paidAt)
      const proofUrl = safeUrl(req.body?.proofUrl)
      const proofTitle = safeText(req.body?.proofTitle, 160) || `${title} receipt`
      const isPublic = Boolean(req.body?.public)

      if (!title || !detail || !/^[a-z]{3}$/.test(currency) || !Number.isSafeInteger(amountCents) || amountCents <= 0 || Number.isNaN(paidAt.getTime())) {
        return res.status(400).json({ error: 'Title, detail, valid amount, currency, and paid date are required.' })
      }
      if (needId && !ID_PATTERN.test(needId)) return res.status(400).json({ error: 'Invalid need.' })
      if (catId && !ID_PATTERN.test(catId)) return res.status(400).json({ error: 'Invalid cat.' })
      if (needId && !(await sql`SELECT need_id FROM garden_care_needs WHERE need_id = ${needId} LIMIT 1`).length) return res.status(404).json({ error: 'Need not found.' })
      if (catId && !(await sql`SELECT cat_id FROM garden_cats WHERE cat_id = ${catId} LIMIT 1`).length) return res.status(404).json({ error: 'Cat not found.' })

      let allocation = null
      if (sessionId) {
        if (!Number.isSafeInteger(fundedCents) || fundedCents <= 0 || fundedCents > amountCents) return res.status(400).json({ error: 'The linked gift amount must be positive and cannot exceed the expense.' })
        allocation = (await sql`
          SELECT a.allocation_id, a.amount_cents, a.status, d.user_id, d.currency,
                 COALESCE(SUM(f.amount_cents), 0)::bigint AS spent_cents
          FROM garden_donation_allocations a
          JOIN garden_donations d ON d.session_id = a.session_id
          LEFT JOIN garden_expense_funding f ON f.allocation_id = a.allocation_id
          WHERE a.session_id = ${sessionId} AND d.payment_status = 'paid'
          GROUP BY a.allocation_id, d.user_id, d.currency
          LIMIT 1
        `)[0]
        if (!allocation) return res.status(404).json({ error: 'Verified gift allocation not found.' })
        if (String(allocation.currency).toLowerCase() !== currency) return res.status(400).json({ error: 'Expense and gift currencies must match.' })
        const available = Number(allocation.amount_cents) - Number(allocation.spent_cents)
        if (fundedCents > available) return res.status(400).json({ error: 'This link exceeds the unspent verified allocation.' })
      }

      const eventRows = await sql`
        INSERT INTO garden_care_events (
          event_key, event_type, cat_id, need_id, title, detail, metadata, public, occurred_at, created_by
        ) VALUES (
          ${`expense:${randomUUID()}`}, 'expense.paid', ${catId}, ${needId}, ${title}, ${detail},
          ${JSON.stringify({ amount_cents: amountCents, currency, vendor })}::jsonb,
          ${isPublic}, ${paidAt.toISOString()}, ${caretaker.userId}
        )
        RETURNING event_id
      `
      let proofId = null
      if (proofUrl) {
        const proofRows = await sql`
          INSERT INTO garden_proof_assets (
            proof_key, event_id, need_id, cat_id, kind, title, url, source, redacted, public, published_at, verified_by
          ) VALUES (
            ${`proof:${randomUUID()}`}, ${eventRows[0].event_id}, ${needId}, ${catId}, 'receipt', ${proofTitle}, ${proofUrl},
            ${vendor || 'Sanctuary expense record'}, TRUE, ${isPublic}, CASE WHEN ${isPublic} THEN NOW() ELSE NULL END, ${caretaker.userId}
          )
          RETURNING proof_id
        `
        proofId = proofRows[0]?.proof_id || null
      }
      const expenseRows = await sql`
        INSERT INTO garden_sanctuary_expenses (
          expense_key, event_id, proof_id, need_id, cat_id, title, detail, vendor,
          amount_cents, currency, status, paid_at, public, created_by
        ) VALUES (
          ${`expense:${randomUUID()}`}, ${eventRows[0].event_id}, ${proofId}, ${needId}, ${catId}, ${title}, ${detail}, ${vendor},
          ${amountCents}, ${currency}, 'paid', ${paidAt.toISOString()}, ${isPublic}, ${caretaker.userId}
        )
        RETURNING expense_id
      `

      if (allocation) {
        await sql`
          INSERT INTO garden_expense_funding (expense_id, allocation_id, amount_cents, linked_by)
          VALUES (${expenseRows[0].expense_id}, ${allocation.allocation_id}, ${fundedCents}, ${caretaker.userId})
        `
        const totalSpent = Number(allocation.spent_cents) + fundedCents
        const fulfilled = totalSpent >= Number(allocation.amount_cents)
        await sql`UPDATE garden_donation_allocations SET status = ${fulfilled ? 'fulfilled' : 'allocated'}, updated_at = NOW() WHERE allocation_id = ${allocation.allocation_id}`
        await sql`UPDATE garden_donations SET allocation_status = ${fulfilled ? 'fulfilled' : 'allocated'} WHERE session_id = ${sessionId}`
        if (allocation.user_id) {
          await sql`
            INSERT INTO garden_notifications (event_id, user_id, cat_id, title, body, action_url)
            VALUES (
              ${eventRows[0].event_id}, ${allocation.user_id}, ${catId}, 'Your gift paid for real sanctuary care',
              ${`${title} was recorded as paid. Your verified gift covered ${currency.toUpperCase()} ${(fundedCents / 100).toFixed(2)} of this expense.`}, '/?profile=open'
            )
          `
        }
      }
      if (isPublic) await publishNotification(sql, { eventId: eventRows[0].event_id, catId, title, body: detail, actionUrl: '/?profile=open' })
      return res.status(200).json({ recorded: true, expenseId: Number(expenseRows[0]?.expense_id || 0) })
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
        await publishNotification(sql, { eventId: rows[0].event_id, catId, title, body: detail, actionUrl: catId ? `/${catId === 'splotch' ? 'Splotch' : catId === 'mabel' ? 'Mabel' : catId === 'winona-p-gray' ? 'Winona' : 'cats'}` : '/' })
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
          actionUrl: resolvedCatId === 'splotch' ? '/Splotch' : resolvedCatId === 'mabel' ? '/Mabel' : resolvedCatId === 'winona-p-gray' ? '/Winona' : '/cats',
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
