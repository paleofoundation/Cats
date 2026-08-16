const { authenticateGardenRequest } = require('./_auth')
const { database, ensureSchema } = require('./_db')

function asNumber(value) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function totalsByCurrency(rows, field) {
  const totals = new Map()
  for (const row of rows) {
    const currency = String(row.currency || 'usd').toLowerCase()
    totals.set(currency, (totals.get(currency) || 0) + asNumber(row[field]))
  }
  return [...totals.entries()].map(([currency, amountCents]) => ({ currency, amountCents }))
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const account = await authenticateGardenRequest(req)
    await ensureSchema()
    const sql = database()

    const [profileRows, donationRows, expenseRows, weekRows] = await Promise.all([
      sql`SELECT state FROM garden_profiles WHERE user_id = ${account.userId} LIMIT 1`,
      sql`
        SELECT d.session_id, d.amount_cents, d.currency, d.frequency, d.created_at, d.badge,
               d.allocation_status, a.allocation_id, a.amount_cents AS allocated_amount_cents,
               a.status AS allocation_record_status, a.note AS allocation_note,
               n.need_id, n.title AS need_title, n.overflow_policy,
               COALESCE(n.cat_id, d.cat_id) AS cat_id, c.name AS cat_name,
               COALESCE(spent.spent_cents, 0)::bigint AS spent_cents
        FROM garden_donations d
        LEFT JOIN garden_donation_allocations a ON a.session_id = d.session_id
        LEFT JOIN garden_care_needs n ON n.need_id = a.need_id
        LEFT JOIN garden_cats c ON c.cat_id = COALESCE(n.cat_id, d.cat_id)
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(f.amount_cents), 0)::bigint AS spent_cents
          FROM garden_expense_funding f
          WHERE f.allocation_id = a.allocation_id
        ) spent ON TRUE
        WHERE d.user_id = ${account.userId} AND d.payment_status = 'paid'
        ORDER BY d.created_at DESC
      `,
      sql`
        SELECT e.expense_id, e.title, e.detail, e.vendor, e.amount_cents, e.currency, e.status,
               e.paid_at, e.need_id, n.title AS need_title, e.cat_id, c.name AS cat_name,
               f.amount_cents AS player_funded_cents,
               p.proof_id, p.kind AS proof_kind, p.title AS proof_title, p.url AS proof_url,
               p.redacted AS proof_redacted, p.published_at AS proof_published_at
        FROM garden_expense_funding f
        JOIN garden_donation_allocations a ON a.allocation_id = f.allocation_id
        JOIN garden_donations d ON d.session_id = a.session_id
        JOIN garden_sanctuary_expenses e ON e.expense_id = f.expense_id
        LEFT JOIN garden_care_needs n ON n.need_id = e.need_id
        LEFT JOIN garden_cats c ON c.cat_id = e.cat_id
        LEFT JOIN garden_proof_assets p ON p.proof_id = e.proof_id AND p.public = TRUE
        WHERE d.user_id = ${account.userId} AND e.status = 'paid'
        ORDER BY e.paid_at DESC, e.expense_id DESC
        LIMIT 50
      `,
      sql`
        SELECT
          TO_CHAR(date_trunc('week', NOW() AT TIME ZONE 'Asia/Nicosia'), 'YYYY-MM-DD') AS week_start,
          TO_CHAR(date_trunc('week', NOW() AT TIME ZONE 'Asia/Nicosia') + INTERVAL '6 days', 'YYYY-MM-DD') AS week_end
      `,
    ])

    const donations = donationRows.map((row) => ({
      ...row,
      amount_cents: asNumber(row.amount_cents),
      allocated_amount_cents: asNumber(row.allocated_amount_cents),
      spent_cents: asNumber(row.spent_cents),
    }))
    const expenses = expenseRows.map((row) => ({
      ...row,
      amount_cents: asNumber(row.amount_cents),
      player_funded_cents: asNumber(row.player_funded_cents),
    }))
    const weeklyExpenses = expenses.filter((expense) => {
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Nicosia', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(expense.paid_at))
      return localDate >= weekRows[0].week_start && localDate <= weekRows[0].week_end
    })

    const cats = new Map()
    for (const expense of expenses) {
      const key = expense.cat_id || 'sanctuary'
      const current = cats.get(key) || {
        catId: expense.cat_id || null,
        name: expense.cat_name || 'The whole sanctuary',
        fundedCents: 0,
        currency: expense.currency,
        paidItems: 0,
      }
      current.fundedCents += expense.player_funded_cents
      current.paidItems += 1
      cats.set(key, current)
    }

    const pendingCents = donations.reduce((total, donation) => {
      return total + Math.max(0, donation.amount_cents - donation.spent_cents)
    }, 0)
    const tokenBalance = Math.max(0, asNumber(profileRows[0]?.state?.gardenTokens))

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      week: weekRows[0],
      totals: {
        gifts: donations.length,
        donatedByCurrency: totalsByCurrency(donations, 'amount_cents'),
        paidByCurrency: totalsByCurrency(expenses, 'player_funded_cents'),
        pendingCents,
      },
      catsHelped: [...cats.values()].sort((a, b) => b.fundedCents - a.fundedCents),
      weeklyExpenses,
      expenses,
      donations,
      gameWallet: {
        balance: tokenBalance,
        label: 'Virtual garden tokens',
        note: 'Earned through gameplay, daily care, and invitations. Real donations are never converted into tokens.',
      },
      policy: 'Virtual tokens remain game currency. Real money is never represented as fictional currency or treated as something the player “spent” on an imaginary object.',
    })
  } catch (error) {
    const statusCode = error?.statusCode || (String(error?.message).includes('database') ? 503 : 500)
    if (statusCode >= 500) console.error('Player impact request failed', error?.message || error)
    return res.status(statusCode).json({ error: error?.message || 'Unable to load your verified impact.' })
  }
}
