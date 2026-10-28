const test = require('node:test')
const assert = require('node:assert/strict')
const { Readable } = require('node:stream')
const Stripe = require('stripe')
const { isCatGardensDonation } = require('../api/_payment-scope')

test('unpaid, incomplete and other-site sessions never become game donations', async () => {
  const { recordDonation } = require('../api/_db')
  assert.equal(await recordDonation({ status: 'complete', payment_status: 'unpaid' }), false)
  assert.equal(await recordDonation({ status: 'open', payment_status: 'paid' }), false)
  assert.equal(await recordDonation({ status: 'complete', payment_status: 'paid', metadata: { application: 'tinies' } }), false)
  assert.equal(isCatGardensDonation({ metadata: { campaign: 'food' } }), false)
  assert.equal(isCatGardensDonation({ metadata: { application: 'catgardens' } }), true)
})

test('real signature verification, delayed success, retries, shared-account isolation and mode isolation', async () => {
  const stripePath = require.resolve('stripe'), dbPath = require.resolve('../api/_db'), handlerPath = require.resolve('../api/stripe-webhook')
  const originals = new Map([stripePath, dbPath, handlerPath].map(path => [path, require.cache[path]]))
  const seenEvents = new Set(), donations = new Set()
  let grantCount = 0, dbCalls = 0, received = []
  const sql = async (parts, ...values) => {
    dbCalls++
    const query = parts.join('?')
    if (query.includes('SELECT event_id')) return seenEvents.has(values[0]) ? [{ event_id: values[0] }] : []
    if (query.includes('INSERT INTO garden_stripe_events')) seenEvents.add(values[0])
    return []
  }
  const signingSecret = 'whsec_local_fixture_not_a_real_credential'
  const realStripe = new Stripe('sk_test_local_fixture')
  require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: class {
    constructor() {
      this.webhooks = realStripe.webhooks
      this.subscriptions = { retrieve: async id => ({ metadata: { application: id === 'sub_garden' ? 'catgardens' : 'tinies', donation_frequency: 'monthly' } }) }
    }
  } }
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
    database: () => sql, ensureSchema: async () => { dbCalls++ },
    recordDonation: async session => {
      received.push(session)
      const key = session.mode === 'subscription' && typeof session.invoice === 'string' ? `invoice:${session.invoice}` : session.id
      if (session.status === 'complete' && session.payment_status === 'paid' && !donations.has(key)) {
        donations.add(key); grantCount++
      }
    }
  } }
  delete require.cache[handlerPath]
  const oldKey = process.env.STRIPE_SECRET_KEY, oldHook = process.env.STRIPE_WEBHOOK_SECRET
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_fixture'; process.env.STRIPE_WEBHOOK_SECRET = signingSecret
  try {
    const handler = require('../api/stripe-webhook')
    const session = { id: 'cs_test_fixture', status: 'complete', payment_status: 'paid', livemode: false, metadata: { application: 'catgardens' } }
    async function send(id, type, object, options = {}) {
      const payload = JSON.stringify({ id, type, livemode: options.live ?? false, data: { object } })
      const signature = realStripe.webhooks.generateTestHeaderString({ payload, secret: options.badSignature ? 'wrong_secret' : signingSecret })
      const req = Readable.from([Buffer.from(payload)]); req.method = 'POST'; req.headers = { 'stripe-signature': signature }
      const res = { setHeader() {}, status(code) { this.code = code; return this }, json(body) { this.body = body; return this }, send(body) { this.body = body; return this } }
      await handler(req, res); return res
    }
    assert.equal((await send('evt_bad', 'checkout.session.completed', session, { badSignature: true })).code, 400)
    assert.equal(dbCalls, 0)
    assert.equal((await send('evt_mode', 'checkout.session.completed', session, { live: true })).code, 400)
    assert.equal(dbCalls, 0)
    assert.equal((await send('evt_other', 'checkout.session.completed', { ...session, metadata: { application: 'tinies' } })).body.ignored, true)
    assert.equal(dbCalls, 0)
    await send('evt_unpaid', 'checkout.session.completed', { ...session, payment_status: 'unpaid' }); assert.equal(grantCount, 0)
    await send('evt_async', 'checkout.session.async_payment_succeeded', session); assert.equal(grantCount, 1)
    assert.equal((await send('evt_async', 'checkout.session.async_payment_succeeded', session)).body.duplicate, true)
    await send('evt_repeated', 'checkout.session.completed', session); assert.equal(grantCount, 1)
    await send('evt_subscription', 'checkout.session.completed', { ...session, id: 'cs_test_monthly', mode: 'subscription', invoice: 'in_first' })
    await send('evt_first_invoice', 'invoice.paid', { id: 'in_first', status: 'paid', amount_paid: 500, currency: 'usd', parent: { subscription_details: { subscription: 'sub_garden' } } })
    assert.equal(grantCount, 2)
    await send('evt_renewal', 'invoice.paid', { id: 'in_renewal', status: 'paid', amount_paid: 500, currency: 'usd', subscription: 'sub_garden' })
    assert.equal(grantCount, 3)
    assert.equal(received.at(-1).livemode, false)
    assert.equal(received.at(-1).metadata.donation_frequency, 'monthly')
    const before = dbCalls
    assert.equal((await send('evt_other_invoice', 'invoice.paid', { id: 'in_other', status: 'paid', amount_paid: 500, subscription: 'sub_tinies' })).body.ignored, true)
    assert.equal(dbCalls, before)
  } finally {
    for (const [path, original] of originals) { if (original) require.cache[path] = original; else delete require.cache[path] }
    if (oldKey === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = oldKey
    if (oldHook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = oldHook
  }
})
