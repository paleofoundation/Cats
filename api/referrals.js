const { randomBytes } = require('node:crypto')
const { authenticateGardenRequest } = require('./_auth')
const { database, ensureSchema } = require('./_db')

const REFERRER_TOKENS = 100
const INVITEE_TOKENS = 75

async function ensureProfile(sql, userId) {
  await sql`
    INSERT INTO garden_profiles (user_id, state) VALUES (${userId}, '{}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `
}

async function addTokens(sql, userId, amount) {
  await ensureProfile(sql, userId)
  await sql`
    UPDATE garden_profiles
    SET state = jsonb_set(
      state,
      '{gardenTokens}',
      to_jsonb(COALESCE(NULLIF(state->>'gardenTokens', '')::integer, 0) + ${amount}),
      true
    ), updated_at = NOW()
    WHERE user_id = ${userId}
  `
}

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const account = await authenticateGardenRequest(req)
    await ensureSchema()
    const sql = database()
    await ensureProfile(sql, account.userId)

    if (req.method === 'POST') {
      const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : ''
      if (!/^[A-F0-9]{12}$/.test(code)) return res.status(400).json({ error: 'That invitation code is not valid.' })
      const rows = await sql`SELECT user_id FROM garden_referral_codes WHERE code = ${code} LIMIT 1`
      const referrerUserId = rows[0]?.user_id
      if (!referrerUserId) return res.status(404).json({ error: 'That invitation has expired or does not exist.' })
      if (referrerUserId === account.userId) return res.status(400).json({ error: 'Your own invitation cannot earn a referral reward.' })
      const inserted = await sql`
        INSERT INTO garden_referral_claims (invitee_user_id, referral_code, referrer_user_id)
        VALUES (${account.userId}, ${code}, ${referrerUserId})
        ON CONFLICT (invitee_user_id) DO NOTHING
        RETURNING invitee_user_id
      `
      if (inserted.length) {
        await addTokens(sql, referrerUserId, REFERRER_TOKENS)
        await addTokens(sql, account.userId, INVITEE_TOKENS)
      }
      const balances = await sql`SELECT COALESCE((state->>'gardenTokens')::integer, 0) AS tokens FROM garden_profiles WHERE user_id = ${account.userId}`
      return res.status(200).json({ accepted: Boolean(inserted.length), inviteeTokens: inserted.length ? INVITEE_TOKENS : 0, tokenBalance: Number(balances[0]?.tokens || 0) })
    }

    let codes = await sql`SELECT code FROM garden_referral_codes WHERE user_id = ${account.userId} LIMIT 1`
    if (!codes.length) {
      const code = randomBytes(6).toString('hex').toUpperCase()
      await sql`
        INSERT INTO garden_referral_codes (code, user_id) VALUES (${code}, ${account.userId})
        ON CONFLICT (user_id) DO NOTHING
      `
      codes = await sql`SELECT code FROM garden_referral_codes WHERE user_id = ${account.userId} LIMIT 1`
    }
    const counts = await sql`SELECT COUNT(*)::integer AS count FROM garden_referral_claims WHERE referrer_user_id = ${account.userId}`
    return res.status(200).json({ code: codes[0]?.code, acceptedCount: Number(counts[0]?.count || 0), rewardPerFriend: REFERRER_TOKENS, friendWelcomeTokens: INVITEE_TOKENS })
  } catch (error) {
    console.error('Garden referral request failed', error?.message || error)
    return res.status(error?.statusCode || 500).json({ error: error?.message || 'Unable to load garden invitations.' })
  }
}
