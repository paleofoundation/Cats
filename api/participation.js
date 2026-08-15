const { database, ensureSchema } = require('./_db')

const REQUEST_TYPES = new Set(['volunteer', 'employment-interest', 'skilled-remote'])
const INTERESTS = new Set(['feeding', 'cleaning', 'cat-socialization', 'brushing', 'garden-work', 'transport', 'photo-video', 'fundraising', 'grant-writing', 'technology', 'supply-procurement', 'care-team'])

function clean(value, maximum) {
  return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, maximum) : ''
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}
  if (body.website) return res.status(200).json({ accepted: true })
  const requestType = REQUEST_TYPES.has(body.requestType) ? body.requestType : ''
  const fullName = clean(body.fullName, 120)
  const email = clean(body.email, 254).toLowerCase()
  const location = clean(body.location, 160)
  const availability = clean(body.availability, 240)
  const message = clean(body.message, 3000)
  const interests = Array.isArray(body.interests) ? [...new Set(body.interests.filter((item) => INTERESTS.has(item)))].slice(0, 12) : []

  if (!requestType) return res.status(400).json({ error: 'Please choose how you would like to participate.' })
  if (fullName.length < 2) return res.status(400).json({ error: 'Please enter your name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
  if (body.privacyConsent !== true) return res.status(400).json({ error: 'Please agree to the privacy notice so we can respond.' })

  try {
    await ensureSchema()
    const sql = database()
    const rows = await sql`
      INSERT INTO garden_participation_requests (
        request_type, full_name, email, location, availability, interests, message, privacy_consent
      ) VALUES (
        ${requestType}, ${fullName}, ${email}, ${location || null}, ${availability || null},
        ${JSON.stringify(interests)}::jsonb, ${message || null}, TRUE
      )
      RETURNING request_id
    `
    return res.status(201).json({ accepted: true, requestId: rows[0].request_id })
  } catch (error) {
    console.error('Unable to save participation request', error?.message || error)
    return res.status(500).json({ error: 'We could not save your request. Please try again.' })
  }
}
