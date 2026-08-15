const { neon } = require('@neondatabase/serverless')

let schemaPromise

function database() {
  if (!process.env.DATABASE_URL) throw new Error('Garden database is not configured.')
  return neon(process.env.DATABASE_URL)
}

const legacyCampaignNeeds = {
  food: 'food',
  'daily-care': 'general-care',
  'medical-care': 'general-care',
  'shelter-and-land': 'mathikoloni',
  'mathikoloni-land': 'mathikoloni',
  general: 'general-care',
}

function normalizeNeedId(metadata = {}) {
  const direct = typeof metadata.need_id === 'string' ? metadata.need_id : ''
  if (direct) return direct
  const campaign = typeof metadata.campaign === 'string' ? metadata.campaign : ''
  return legacyCampaignNeeds[campaign] || 'general-care'
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
      await sql`ALTER TABLE garden_donations ADD COLUMN IF NOT EXISTS cat_id TEXT`
      await sql`ALTER TABLE garden_donations ADD COLUMN IF NOT EXISTS program TEXT`
      await sql`ALTER TABLE garden_donations ADD COLUMN IF NOT EXISTS donor_name TEXT`
      await sql`ALTER TABLE garden_donations ADD COLUMN IF NOT EXISTS allocation_status TEXT NOT NULL DEFAULT 'pending_sanctuary_review'`
      await sql`CREATE INDEX IF NOT EXISTS garden_donations_user_id_idx ON garden_donations (user_id)`
      await sql`CREATE INDEX IF NOT EXISTS garden_donations_need_id_idx ON garden_donations (need_id)`
      await sql`
        CREATE TABLE IF NOT EXISTS garden_stripe_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_referral_codes (
          code TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_referral_claims (
          invitee_user_id TEXT PRIMARY KEY,
          referral_code TEXT NOT NULL REFERENCES garden_referral_codes(code),
          referrer_user_id TEXT NOT NULL,
          claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS garden_referral_claims_referrer_idx ON garden_referral_claims (referrer_user_id)`

      await sql`
        CREATE TABLE IF NOT EXISTS garden_cats (
          cat_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          summary TEXT NOT NULL,
          difficulty TEXT NOT NULL DEFAULT 'easy',
          life_status TEXT NOT NULL DEFAULT 'active',
          profile_path TEXT,
          public BOOLEAN NOT NULL DEFAULT TRUE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_care_needs (
          need_id TEXT PRIMARY KEY,
          cat_id TEXT REFERENCES garden_cats(cat_id),
          program TEXT NOT NULL DEFAULT 'cat-care',
          title TEXT NOT NULL,
          detail TEXT NOT NULL,
          goal_cents BIGINT,
          suggested_cents BIGINT NOT NULL DEFAULT 1000,
          currency TEXT NOT NULL DEFAULT 'usd',
          status TEXT NOT NULL DEFAULT 'open',
          fulfillment_status TEXT NOT NULL DEFAULT 'published',
          overflow_policy TEXT NOT NULL,
          public BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_donation_allocations (
          allocation_id BIGSERIAL PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES garden_donations(session_id) ON DELETE CASCADE,
          need_id TEXT NOT NULL REFERENCES garden_care_needs(need_id),
          amount_cents BIGINT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending_sanctuary_review',
          note TEXT,
          allocated_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (session_id, need_id)
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS garden_allocations_need_idx ON garden_donation_allocations (need_id, status)`
      await sql`
        CREATE TABLE IF NOT EXISTS garden_care_events (
          event_id BIGSERIAL PRIMARY KEY,
          event_key TEXT UNIQUE,
          event_type TEXT NOT NULL,
          cat_id TEXT REFERENCES garden_cats(cat_id),
          need_id TEXT REFERENCES garden_care_needs(need_id),
          user_id TEXT,
          title TEXT NOT NULL,
          detail TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          public BOOLEAN NOT NULL DEFAULT FALSE,
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_by TEXT
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS garden_care_events_public_idx ON garden_care_events (public, occurred_at DESC)`
      await sql`
        CREATE TABLE IF NOT EXISTS garden_proof_assets (
          proof_id BIGSERIAL PRIMARY KEY,
          proof_key TEXT UNIQUE,
          event_id BIGINT REFERENCES garden_care_events(event_id) ON DELETE SET NULL,
          need_id TEXT REFERENCES garden_care_needs(need_id),
          cat_id TEXT REFERENCES garden_cats(cat_id),
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          source TEXT,
          redacted BOOLEAN NOT NULL DEFAULT FALSE,
          public BOOLEAN NOT NULL DEFAULT FALSE,
          published_at TIMESTAMPTZ,
          verified_by TEXT
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_notifications (
          notification_id BIGSERIAL PRIMARY KEY,
          event_id BIGINT REFERENCES garden_care_events(event_id) ON DELETE CASCADE,
          user_id TEXT,
          cat_id TEXT REFERENCES garden_cats(cat_id),
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          action_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_notification_reads (
          notification_id BIGINT NOT NULL REFERENCES garden_notifications(notification_id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (notification_id, user_id)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_caretaker_roles (
          user_id TEXT PRIMARY KEY,
          role TEXT NOT NULL DEFAULT 'caretaker',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_participation_requests (
          request_id BIGSERIAL PRIMARY KEY,
          request_type TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          location TEXT,
          availability TEXT,
          interests JSONB NOT NULL DEFAULT '[]'::jsonb,
          message TEXT,
          privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS garden_participation_status_idx ON garden_participation_requests (status, created_at DESC)`
      await sql`
        CREATE TABLE IF NOT EXISTS garden_cat_relationships (
          relationship_id BIGSERIAL PRIMARY KEY,
          cat_id TEXT NOT NULL REFERENCES garden_cats(cat_id),
          related_cat_id TEXT NOT NULL REFERENCES garden_cats(cat_id),
          relationship_label TEXT NOT NULL,
          public BOOLEAN NOT NULL DEFAULT TRUE,
          source_status TEXT NOT NULL DEFAULT 'sanctuary_reported',
          UNIQUE (cat_id, related_cat_id, relationship_label)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS garden_care_schedules (
          schedule_id BIGSERIAL PRIMARY KEY,
          cat_id TEXT NOT NULL REFERENCES garden_cats(cat_id),
          care_name TEXT NOT NULL,
          care_category TEXT NOT NULL,
          cadence TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'awaiting_import',
          public BOOLEAN NOT NULL DEFAULT FALSE,
          source TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `

      await sql`
        INSERT INTO garden_cats (cat_id, name, summary, difficulty, profile_path)
        VALUES
          ('splotch', 'Splotch', 'A large orange adult male who loves unhurried human attention and currently lives near a busy road.', 'easy', '/Splotch'),
          ('mabel', 'Mabel', 'A shy, affectionate FIV-positive resident with a higher-support care routine.', 'advanced', '/Mabel'),
          ('gabriel', 'Gabriel', 'A long-haired trust graduate who needs patient social time and warm-weather brushing.', 'easy', '/cats'),
          ('poly', 'Poly', 'Gabriel’s affectionate long-haired sister, with a recurring summer coat-care routine.', 'easy', '/cats'),
          ('chili-pepper', 'Chili Pepper', 'Show Pony: an energetic resident and sister of Zucchini and the late Cucumber.', 'easy', '/cats'),
          ('zucchini', 'Zucchini', 'Chili Pepper’s sibling. A fuller sanctuary-reviewed profile is being prepared.', 'easy', '/cats'),
          ('cucumber', 'Cucumber', 'Chili Pepper and Zucchini’s sibling, remembered after dying from FIP.', 'advanced', '/cats'),
          ('gemini', 'Gemini', 'One half of the inseparable pair known at Cat Gardens as the Honeymooners.', 'easy', '/cats'),
          ('nelly', 'Nelly', 'Also called Nelly Belly; Gemini’s constant companion and the other Honeymooner.', 'easy', '/cats')
        ON CONFLICT (cat_id) DO NOTHING
      `

      await sql`UPDATE garden_cats SET life_status = 'passed' WHERE cat_id = 'cucumber'`
      await sql`
        INSERT INTO garden_cat_relationships (cat_id, related_cat_id, relationship_label)
        VALUES
          ('chili-pepper', 'zucchini', 'siblings'),
          ('chili-pepper', 'cucumber', 'siblings · Cucumber in memory'),
          ('zucchini', 'cucumber', 'siblings · Cucumber in memory'),
          ('gemini', 'nelly', 'bonded pair · The Honeymooners'),
          ('nelly', 'gemini', 'bonded pair · The Honeymooners')
        ON CONFLICT (cat_id, related_cat_id, relationship_label) DO NOTHING
      `

      const overflowPolicy = 'If this need is already covered, the sanctuary will route the gift to the next published care need for this cat or to daily sanctuary care. The final allocation will appear in the care record.'
      const generalPolicy = 'This gift supports the most urgent reviewed sanctuary need. The final allocation will appear in the care record.'
      const dreamPolicy = 'Until a property is acquired, gifts designated for the dream remain part of the sanctuary and land program. Cat Gardens does not claim to own the Mathikoloni property.'
      await sql`
        INSERT INTO garden_care_needs (
          need_id, cat_id, program, title, detail, goal_cents, suggested_cents, status, fulfillment_status, overflow_policy
        ) VALUES
          ('general-care', NULL, 'sanctuary', 'Daily sanctuary care', 'Food, water, cleaning, bedding, routine observation, transport, and the human work required to care for more than ninety cats.', NULL, 1000, 'open', 'published', ${generalPolicy}),
          ('food', 'splotch', 'cat-care', 'Food for Splotch and the shared garden', 'A recurring need. The reviewed monthly cost will be added after accounting review rather than estimated inside the game.', NULL, 1000, 'open', 'published', ${overflowPolicy}),
          ('medical-care', NULL, 'sanctuary', 'Veterinary and medical care', 'Reviewed veterinary visits, diagnostics, medication, supportive care, transport, and medical supplies for Cat Gardens residents.', NULL, 10000, 'open', 'published', ${generalPolicy}),
          ('care-team', NULL, 'sanctuary', 'The human care team', 'The real people who feed, clean, observe, transport, brush, medicate, document, and spend patient time with the cats.', NULL, 10000, 'open', 'published', ${generalPolicy}),
          ('full-month', NULL, 'sanctuary', 'One historical operating month', 'A $12,000 historical operating snapshot from the original sanctuary website. Current costs are being reconciled; this is not presented as a live audited monthly total.', 1200000, 1200000, 'historical_snapshot', 'published', ${generalPolicy}),
          ('future-dental', 'splotch', 'cat-care', 'Splotch’s preventive dental reserve', 'Splotch has no current health crisis. Timing and cost must be reviewed with the sanctuary veterinarian before this need is marked scheduled.', NULL, 2500, 'review', 'published', ${overflowPolicy}),
          ('petting', 'splotch', 'cat-care', 'A documented petting session', 'Dedicated human time for Splotch, followed by a caretaker-confirmed update for the people bonded with him.', NULL, 1500, 'open', 'published', ${overflowPolicy}),
          ('media', 'splotch', 'cat-care', 'Splotch photography and video', 'A real photography or video session that becomes a verified dispatch in Splotch’s journal and playable garden.', NULL, 2500, 'open', 'published', ${overflowPolicy}),
          ('tracker', 'splotch', 'cat-care', 'A suitable safety tracker', 'The sanctuary will compare a breakaway-mounted location tag with a true GPS pet tracker before naming the final equipment.', NULL, 3500, 'review', 'published', ${overflowPolicy}),
          ('mathikoloni', 'splotch', 'sanctuary', 'The Mathikoloni sanctuary dream', 'Land away from traffic, warm winter rooms, protected gardens, visitors, and resident caretakers. Cat Gardens does not own the property.', NULL, 10000, 'proposed', 'published', ${dreamPolicy}),
          ('tv-pilot', NULL, 'cat-gardens-tv', 'Build the first privacy-safe camera station', 'Site survey, fixed camera, privacy masking, isolated network, local recording, battery backup, installation, and a public proof report.', NULL, 5000, 'review', 'published', ${generalPolicy}),
          ('tv-operations', NULL, 'cat-gardens-tv', 'Keep Cat Gardens TV operating', 'Connectivity, storage, maintenance, privacy review, captions, moderation, and the human work required to publish trustworthy updates.', NULL, 2500, 'review', 'published', ${generalPolicy}),
          ('gabriel-trust', 'gabriel', 'cat-care', 'Patient human time for Gabriel', 'Supervised volunteer coordination, gentle trust sessions, brushing, and reviewed media documenting Gabriel’s relationship journey.', NULL, 1500, 'review', 'published', ${overflowPolicy}),
          ('fluff-care', NULL, 'cat-care', 'Summer care for Gabriel and Poly', 'Brushes, cooling, fresh-water infrastructure, coat checks, and dedicated human care for the long-haired siblings during Cyprus heat.', NULL, 1000, 'review', 'published', ${generalPolicy})
        ON CONFLICT (need_id) DO NOTHING
      `

      const dispatchRows = await sql`
        INSERT INTO garden_care_events (
          event_key, event_type, cat_id, need_id, title, detail, metadata, public, occurred_at, created_by
        ) VALUES (
          'splotch-dispatch-2026-08-15', 'dispatch.published', 'splotch', 'media',
          'Splotch asked for more pets',
          'The real Splotch approached Karen for affection while other Cat Gardens residents gathered nearby.',
          ${JSON.stringify({ world_artifact: 'splotch-first-dispatch', source: 'Cat Gardens field video' })}::jsonb,
          TRUE, '2026-08-15T18:20:00+03:00'::timestamptz, 'sanctuary'
        )
        ON CONFLICT (event_key) DO UPDATE SET
          title = EXCLUDED.title,
          detail = EXCLUDED.detail,
          metadata = EXCLUDED.metadata,
          public = TRUE
        RETURNING event_id
      `
      const dispatchEvent = dispatchRows[0] || (await sql`SELECT event_id FROM garden_care_events WHERE event_key = 'splotch-dispatch-2026-08-15' LIMIT 1`)[0]
      if (dispatchEvent) {
        await sql`
          INSERT INTO garden_proof_assets (
            proof_key, event_id, need_id, cat_id, kind, title, url, source, public, published_at, verified_by
          ) VALUES (
            'splotch-video-2026-08-15', ${dispatchEvent.event_id}, 'media', 'splotch', 'video',
            'Watch the real Splotch ask for pets', '/videos/splotch-petting.mp4', 'Cat Gardens field video', TRUE,
            '2026-08-15T18:20:00+03:00'::timestamptz, 'Karen Pendergrass'
          )
          ON CONFLICT (proof_key) DO NOTHING
        `
        await sql`
          INSERT INTO garden_notifications (event_id, cat_id, title, body, action_url)
          SELECT ${dispatchEvent.event_id}, 'splotch', 'A real Splotch dispatch arrived', 'Splotch asked for more pets in Cyprus. The field video is now part of his permanent garden record.', '/Splotch'
          WHERE NOT EXISTS (
            SELECT 1 FROM garden_notifications WHERE event_id = ${dispatchEvent.event_id} AND user_id IS NULL
          )
        `
      }

      const mabelDispatchRows = await sql`
        INSERT INTO garden_care_events (
          event_key, event_type, cat_id, need_id, title, detail, metadata, public, occurred_at, created_by
        ) VALUES (
          'mabel-youtube-2026-08-15', 'dispatch.published', 'mabel', NULL,
          'Mabel is a very fishy girl',
          'A new real-life Mabel Fish update was published by Cat Gardens on YouTube.',
          ${JSON.stringify({ world_artifact: 'mabel-fishy-girl-dispatch', source: 'Cat Gardens YouTube channel', youtube_id: 'aH2YusZRidI' })}::jsonb,
          TRUE, '2026-08-15T22:00:00+03:00'::timestamptz, 'sanctuary'
        )
        ON CONFLICT (event_key) DO UPDATE SET
          title = EXCLUDED.title,
          detail = EXCLUDED.detail,
          metadata = EXCLUDED.metadata,
          public = TRUE
        RETURNING event_id
      `
      const mabelDispatch = mabelDispatchRows[0] || (await sql`SELECT event_id FROM garden_care_events WHERE event_key = 'mabel-youtube-2026-08-15' LIMIT 1`)[0]
      if (mabelDispatch) {
        await sql`
          INSERT INTO garden_proof_assets (
            proof_key, event_id, need_id, cat_id, kind, title, url, source, public, published_at, verified_by
          ) VALUES (
            'mabel-youtube-aH2YusZRidI', ${mabelDispatch.event_id}, NULL, 'mabel', 'video',
            'Watch Mabel is a Very Fishy Girl', 'https://www.youtube.com/shorts/aH2YusZRidI', 'Cat Gardens YouTube channel', TRUE,
            '2026-08-15T22:00:00+03:00'::timestamptz, 'Karen Pendergrass'
          )
          ON CONFLICT (proof_key) DO UPDATE SET
            title = EXCLUDED.title,
            url = EXCLUDED.url,
            source = EXCLUDED.source,
            public = TRUE
        `
        await sql`
          INSERT INTO garden_notifications (event_id, cat_id, title, body, action_url)
          SELECT ${mabelDispatch.event_id}, 'mabel', 'A new Mabel dispatch arrived', 'Mabel Fish has a new real-life video from Cat Gardens.', '/Mabel'
          WHERE NOT EXISTS (
            SELECT 1 FROM garden_notifications WHERE event_id = ${mabelDispatch.event_id} AND user_id IS NULL
          )
        `
      }
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
  const recordId = session.mode === 'subscription' && typeof session.invoice === 'string'
    ? `invoice:${session.invoice}`
    : session.id
  const requestedNeedId = normalizeNeedId(metadata)
  const knownNeed = await sql`SELECT need_id FROM garden_care_needs WHERE need_id = ${requestedNeedId} LIMIT 1`
  const needId = knownNeed[0]?.need_id || 'general-care'
  const requestedCatId = typeof metadata.cat_id === 'string' ? metadata.cat_id : ''
  const knownCat = requestedCatId
    ? await sql`SELECT cat_id FROM garden_cats WHERE cat_id = ${requestedCatId} LIMIT 1`
    : []
  const eventCatId = knownCat[0]?.cat_id || null
  const inserted = await sql`
    INSERT INTO garden_donations (
      session_id, user_id, stripe_customer_id, amount_cents, currency, badge, need_id, frequency,
      payment_status, cat_id, program, donor_name, allocation_status
    ) VALUES (
      ${recordId}, ${metadata.app_user_id || null}, ${typeof session.customer === 'string' ? session.customer : null},
      ${amountCents}, ${session.currency || 'usd'}, ${metadata.badge || 'garden-keeper'}, ${needId},
      ${metadata.donation_frequency || 'once'}, ${session.payment_status}, ${metadata.cat_id || null},
      ${metadata.program || 'sanctuary'}, ${metadata.donor_name || null}, 'pending_sanctuary_review'
    )
    ON CONFLICT (session_id) DO NOTHING
    RETURNING session_id
  `
  if (!inserted.length) return false

  await sql`
    INSERT INTO garden_donation_allocations (session_id, need_id, amount_cents, status, note)
    VALUES (
      ${recordId}, ${needId}, ${amountCents}, 'pending_sanctuary_review',
      'Payment verified. Final sanctuary allocation and any overflow routing await caretaker review.'
    )
    ON CONFLICT (session_id, need_id) DO NOTHING
  `
  const eventRows = await sql`
    INSERT INTO garden_care_events (
      event_key, event_type, cat_id, need_id, user_id, title, detail, metadata, public, created_by
    ) VALUES (
      ${`donation:${recordId}`}, 'donation.verified', ${eventCatId}, ${needId},
      ${metadata.app_user_id || null}, 'A real contribution was verified',
      'Stripe confirmed the payment. Sanctuary allocation is now awaiting review; virtual tokens remain separate game currency.',
      ${JSON.stringify({ amount_cents: amountCents, currency: session.currency || 'usd', allocation_status: 'pending_sanctuary_review' })}::jsonb,
      FALSE, 'stripe'
    )
    ON CONFLICT (event_key) DO NOTHING
    RETURNING event_id
  `
  if (metadata.app_user_id && eventRows[0]) {
    await sql`
      INSERT INTO garden_notifications (event_id, user_id, cat_id, title, body, action_url)
      VALUES (
        ${eventRows[0].event_id}, ${metadata.app_user_id}, ${eventCatId},
        'Your real gift was verified',
        'The payment is recorded. The sanctuary will publish its final allocation separately from your virtual garden tokens.',
        '/?profile=open'
      )
    `
  }
  return true
}

module.exports = { database, ensureSchema, normalizeNeedId, recordDonation }
