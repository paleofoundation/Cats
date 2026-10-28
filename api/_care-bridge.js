const { timingSafeEqual } = require('node:crypto')
const PUBLIC_KEYS = new Set(['source', 'id', 'version', 'state', 'catId', 'title', 'detail', 'occurredAt'])
function authorizedBridge(header, secret) {
  if (typeof secret !== 'string' || secret.length < 32 || typeof header !== 'string') return false
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(header)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
function publicCareUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !PUBLIC_KEYS.has(key))) throw new Error('Only approved public fields are accepted.')
  if (body.source !== 'catgardens-care' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.id || '')) throw new Error('Invalid source record.')
  if (!Number.isSafeInteger(body.version) || body.version < 1 || body.version > 1000000) throw new Error('Invalid public version.')
  if (!['published', 'withdrawn'].includes(body.state)) throw new Error('Invalid public state.')
  if (body.catId !== null && (typeof body.catId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(body.catId))) throw new Error('Invalid public cat.')
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160 || typeof body.detail !== 'string' || !body.detail.trim() || body.detail.length > 1600) throw new Error('A bounded public title and summary are required.')
  if (typeof body.occurredAt !== 'string' || !Number.isFinite(Date.parse(body.occurredAt)) || Date.parse(body.occurredAt) > Date.now() + 300000) throw new Error('Invalid actual event time.')
  return { ...body, title: body.title.trim(), detail: body.detail.trim(), occurredAt: new Date(body.occurredAt).toISOString() }
}
module.exports = { authorizedBridge, publicCareUpdate }
