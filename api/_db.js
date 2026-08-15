const { neon } = require('@neondatabase/serverless')

let schemaPromise

function database() {
  if (!process.env.DATABASE_URL) throw new Error('Garden database is not configured.')
  return neon(process.env.DATABASE_URL)
}

async function ensureSchema() {
  if (!schemaPromise) {
    const sql = database()
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS garden_profiles (
          user_id TEXT PRIMARY KEY,
          email TEXT,
          display_name TEXT,
          state JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_donations (
          session_id TEXT PRIMARY KEY,
          user_id TEXT,
          stripe_customer_id TEXT,
          amount_cents BIGINT NOT NULL,
          currency TEXT NOT NULL,
          badge TEXT NOT NULL,
          need_id TEXT,
          frequency TEXT NOT NULL,
          payment_status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS garden_donations_user_id_idx ON garden_donations (user_id)`
      await sql`
        CREATE TABLE IF NOT EXISTS garden_stripe_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
    })().catch((error) => {
      schemaPromise = undefined
      throw error
    })
  }
  await schemaPromise
}

async function recordDonation(session) {
  if (!session || session.status !== 'complete' || session.payment_status !== 'paid') return false
  await ensureSchema()
  const sql = database()
  const metadata = session.metadata || {}
  const amountCents = Number(session.amount_total || 0)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return false
  await sql`
    INSERT INTO garden_donations (
      session_id, user_id, stripe_customer_id, amount_cents, currency, badge, need_id, frequency, payment_status
    ) VALUES (
      ${session.id}, ${metadata.app_user_id || null}, ${typeof session.customer === 'string' ? session.customer : null},
      ${amountCents}, ${session.currency || 'usd'}, ${metadata.badge || 'garden-keeper'},
      ${metadata.need_id || null}, ${metadata.donation_frequency || 'once'}, ${session.payment_status}
    )
    ON CONFLICT (session_id) DO NOTHING
  `
  return true
}

module.exports = { database, ensureSchema, recordDonation }
