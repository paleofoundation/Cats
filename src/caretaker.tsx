import { StrictMode, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, BadgeCheck, CircleDollarSign, FileCheck2, LoaderCircle, LogIn, RefreshCw, Send, Shield, Users, Video } from 'lucide-react'
import { GardenAccountProvider, useGardenAccount } from './account'
import './caretaker.css'

type CareNeed = {
  need_id: string
  cat_id: string | null
  title: string
  detail: string
  goal_cents: number | null
  status: string
  fulfillment_status: string
  overflow_policy: string
}

type CareEvent = { event_id: number; cat_id: string | null; need_id: string | null; title: string; detail: string; event_type: string; public: boolean; occurred_at: string }
type CareProof = { proof_id: number; event_id: number | null; title: string; url: string; kind: string; public: boolean; published_at: string | null }
type CareDonation = { session_id: string; amount_cents: number; currency: string; need_id: string | null; donor_name: string | null; allocation_status: string; allocated_amount_cents: number | null; created_at: string }
type ParticipationRequest = { request_id: number; request_type: string; full_name: string; email: string; location: string | null; availability: string | null; interests: string[]; message: string | null; status: string; created_at: string }
type CaretakerData = { caretaker: { userId: string; role: string }; needs: CareNeed[]; events: CareEvent[]; proofs: CareProof[]; donations: CareDonation[]; participationRequests: ParticipationRequest[] }

const money = (cents: number, currency = 'usd') => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)

function NeedEditor({ need, busy, onSave }: { need: CareNeed; busy: boolean; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const [title, setTitle] = useState(need.title)
  const [detail, setDetail] = useState(need.detail)
  const [overflow, setOverflow] = useState(need.overflow_policy)
  const [goal, setGoal] = useState(need.goal_cents === null ? '' : String(need.goal_cents / 100))
  const [status, setStatus] = useState(need.status)
  const [fulfillment, setFulfillment] = useState(need.fulfillment_status)
  return (
    <form className="care-card need-editor" onSubmit={(event) => {
      event.preventDefault()
      const parsedGoal = Number(goal)
      onSave({ action: 'update_need', needId: need.need_id, title, detail, overflowPolicy: overflow, goalCents: goal.trim() && Number.isFinite(parsedGoal) ? Math.round(parsedGoal * 100) : null, status, fulfillmentStatus: fulfillment })
    }}>
      <div className="care-card-kicker"><span>{need.cat_id || 'SANCTUARY'}</span><b>{need.need_id}</b></div>
      <input aria-label="Need title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <textarea aria-label="Need detail" rows={3} value={detail} onChange={(event) => setDetail(event.target.value)} />
      <div className="care-form-row">
        <label>Public state<select value={status} onChange={(event) => setStatus(event.target.value)}><option>open</option><option>review</option><option>proposed</option><option>fulfilled</option><option>paused</option></select></label>
        <label>Fulfillment<select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}><option>published</option><option>funding</option><option>funded</option><option>ordered</option><option>in_progress</option><option>verified</option></select></label>
        <label>Reviewed goal (USD)<input inputMode="decimal" type="number" min="0" step="0.01" value={goal} placeholder="Unknown" onChange={(event) => setGoal(event.target.value)} /></label>
      </div>
      <label>Overflow policy<textarea rows={2} value={overflow} onChange={(event) => setOverflow(event.target.value)} /></label>
      <button disabled={busy}><BadgeCheck size={15} /> Save published need</button>
    </form>
  )
}

function CaretakerRoom() {
  const account = useGardenAccount()
  const [data, setData] = useState<CaretakerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const api = useCallback(async (method: 'GET' | 'POST', body?: Record<string, unknown>) => {
    const token = await account.getToken()
    if (!token) throw new Error('Sign in is required.')
    const response = await fetch('/api/caretaker', {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'The caretaker record could not be updated.')
    return payload
  }, [account.getToken])

  const refresh = useCallback(async () => {
    if (!account.signedIn) return
    setLoading(true)
    try {
      setData(await api('GET'))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to open the caretaker room.')
    } finally {
      setLoading(false)
    }
  }, [account.signedIn, api])

  useEffect(() => { refresh().catch(() => undefined) }, [refresh])

  const mutate = useCallback(async (body: Record<string, unknown>, success: string) => {
    setBusy(true)
    try {
      await api('POST', body)
      setNotice(success)
      setError(null)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update the sanctuary record.')
    } finally {
      setBusy(false)
    }
  }, [api, refresh])

  const pendingDonations = useMemo(() => data?.donations.filter((item) => item.allocation_status === 'pending_sanctuary_review') || [], [data])

  if (!account.loaded) return <main className="care-gate"><LoaderCircle className="care-spin" /><p>Opening the caretaker room…</p></main>
  if (!account.configured) return <main className="care-gate"><Shield /><h1>Account service is not configured.</h1><a href="/">Return to Cat Gardens</a></main>
  if (!account.signedIn) return <main className="care-gate"><Shield /><p className="care-eyebrow">PRIVATE SANCTUARY OPERATIONS</p><h1>The caretaker room.</h1><p>Only authorized Cat Gardens staff can allocate verified gifts, publish field events, and attach proof.</p><button onClick={account.openSignIn}><LogIn size={17} /> Sign in</button><a href="/">Return to the garden</a></main>

  return (
    <main className="caretaker-shell">
      <header className="care-header">
        <a href="/"><ArrowLeft size={16} /> Garden</a>
        <div><p className="care-eyebrow">CAT GARDENS · PRIVATE OPERATIONS</p><h1>Reality publishing room.</h1><span>{data ? `${data.caretaker.role} · ${account.name}` : account.name}</span></div>
        <button onClick={() => refresh()} disabled={loading}><RefreshCw className={loading ? 'care-spin' : ''} size={16} /> Refresh</button>
      </header>

      <section className="care-truth"><Shield size={20} /><div><strong>Virtual tokens remain game currency.</strong><span>Real money is never represented as fictional currency or treated as something the player “spent” on an imaginary object.</span></div></section>
      {error && <p className="care-alert error">{error}</p>}
      {notice && <p className="care-alert success">{notice}</p>}

      {!data && loading && <section className="care-loading"><LoaderCircle className="care-spin" /> Loading the real sanctuary ledger…</section>}
      {data && (
        <>
          <section className="care-summary">
            <article><small>RECEIVED FOR REVIEW</small><strong>{pendingDonations.length}</strong><span>verified Stripe gifts</span></article>
            <article><small>PUBLISHED NEEDS</small><strong>{data.needs.length}</strong><span>no invented totals</span></article>
            <article><small>FIELD EVENTS</small><strong>{data.events.length}</strong><span>public and private</span></article>
            <article><small>PROOF ASSETS</small><strong>{data.proofs.length}</strong><span>receipts, photos, video</span></article>
            <article><small>PEOPLE OFFERING HELP</small><strong>{data.participationRequests.filter((item) => item.status === 'new').length}</strong><span>new private requests</span></article>
          </section>

          <section className="care-section">
            <div className="care-section-title"><div><p className="care-eyebrow">01 · MONEY RECEIVED IS NOT CARE FULFILLED</p><h2>Review allocations.</h2></div><CircleDollarSign /></div>
            {pendingDonations.length === 0 ? <p className="care-empty">No verified gifts are waiting for sanctuary review.</p> : <div className="allocation-list">{pendingDonations.map((donation) => <AllocationEditor key={donation.session_id} donation={donation} needs={data.needs} busy={busy} onReview={(body) => mutate(body, 'Allocation reviewed. The donor’s reality thread can now show where the gift went.')} />)}</div>}
          </section>

          <section className="care-section">
            <div className="care-section-title"><div><p className="care-eyebrow">02 · REAL PEOPLE ENTER THE WORK</p><h2>Participation requests.</h2></div><Users /></div>
            {data.participationRequests.length === 0 ? <p className="care-empty">No participation requests have arrived yet.</p> : <div className="participation-list">{data.participationRequests.map((request) => <ParticipationReview key={request.request_id} request={request} busy={busy} onReview={(body) => mutate(body, `${request.full_name}’s request was updated.`)} />)}</div>}
          </section>

          <section className="care-section">
            <div className="care-section-title"><div><p className="care-eyebrow">03 · PUBLISH ONLY WHAT IS KNOWN</p><h2>Care needs.</h2></div><BadgeCheck /></div>
            <div className="needs-admin-grid">{data.needs.map((need) => <NeedEditor key={`${need.need_id}-${need.status}-${need.fulfillment_status}-${need.goal_cents}`} need={need} busy={busy} onSave={(body) => mutate(body, `${need.title} was updated.`)} />)}</div>
          </section>

          <section className="care-section care-publish-grid">
            <EventPublisher busy={busy} needs={data.needs} onPublish={(body) => mutate(body, 'The field event was recorded.')} />
            <ProofPublisher busy={busy} events={data.events} onPublish={(body) => mutate(body, 'Proof attached to the sanctuary record.')} />
          </section>
        </>
      )}
    </main>
  )
}

function ParticipationReview({ request, busy, onReview }: { request: ParticipationRequest; busy: boolean; onReview: (body: Record<string, unknown>) => Promise<void> }) {
  const [status, setStatus] = useState(request.status)
  return <article className="participation-row"><div><small>{request.request_type.replace('-', ' ').toUpperCase()}</small><strong>{request.full_name}</strong><a href={`mailto:${request.email}`}>{request.email}</a><span>{request.location || 'Location not supplied'} · {new Date(request.created_at).toLocaleString()}</span></div><div><b>INTERESTS</b><p>{request.interests?.length ? request.interests.join(' · ') : 'Not specified'}</p><b>AVAILABILITY</b><p>{request.availability || 'Not specified'}</p></div><div><b>MESSAGE</b><p>{request.message || 'No additional message.'}</p></div><label>Review state<select value={status} onChange={(event) => setStatus(event.target.value)}><option>new</option><option>reviewing</option><option>contacted</option><option>scheduled</option><option>closed</option></select><button disabled={busy || status === request.status} onClick={() => onReview({ action: 'review_participation', requestId: request.request_id, status })}><BadgeCheck size={13} /> Save</button></label></article>
}

function AllocationEditor({ donation, needs, busy, onReview }: { donation: CareDonation; needs: CareNeed[]; busy: boolean; onReview: (body: Record<string, unknown>) => Promise<void> }) {
  const [needId, setNeedId] = useState(donation.need_id || 'general-care')
  const [note, setNote] = useState('')
  return <form className="allocation-row" onSubmit={(event) => { event.preventDefault(); onReview({ action: 'review_allocation', sessionId: donation.session_id, needId, status: 'allocated', amountCents: donation.amount_cents, note }) }}><div><small>VERIFIED STRIPE GIFT</small><strong>{money(donation.amount_cents, donation.currency)}</strong><span>{new Date(donation.created_at).toLocaleString()} · donor identity private</span></div><label>Allocate to<select value={needId} onChange={(event) => setNeedId(event.target.value)}>{needs.map((need) => <option value={need.need_id} key={need.need_id}>{need.title}</option>)}</select></label><label>Internal note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" /></label><button disabled={busy}><BadgeCheck size={14} /> Review</button></form>
}

function EventPublisher({ needs, busy, onPublish }: { needs: CareNeed[]; busy: boolean; onPublish: (body: Record<string, unknown>) => Promise<void> }) {
  return <form className="publish-card" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); onPublish({ action: 'publish_event', eventType: form.get('eventType'), catId: form.get('catId'), needId: form.get('needId'), title: form.get('title'), detail: form.get('detail'), worldArtifact: form.get('worldArtifact'), public: form.get('public') === 'on' }).then(() => formElement.reset()) }}><Video /><p className="care-eyebrow">04 · FIELD DISPATCH</p><h2>Record what happened.</h2><label>Type<select name="eventType"><option value="care.completed">Care completed</option><option value="dispatch.published">Dispatch published</option><option value="need.updated">Need updated</option><option value="cat.updated">Cat update</option><option value="funds.allocated">Funds allocated</option></select></label><div className="care-form-row"><label>Cat<select name="catId"><option value="">Sanctuary-wide</option><option value="splotch">Splotch</option><option value="mabel">Mabel</option><option value="gabriel">Gabriel</option><option value="poly">Poly</option></select></label><label>Need<select name="needId"><option value="">None</option>{needs.map((need) => <option value={need.need_id} key={need.need_id}>{need.title}</option>)}</select></label></div><label>Title<input name="title" required maxLength={160} /></label><label>What happened<textarea name="detail" rows={4} required maxLength={1600} /></label><label>World artifact key<input name="worldArtifact" placeholder="Optional · e.g. splotch-field-update" /></label><label className="care-check"><input type="checkbox" name="public" /> Publish to the player’s reality thread</label><button disabled={busy}><Send size={15} /> Record event</button></form>
}

function ProofPublisher({ events, busy, onPublish }: { events: CareEvent[]; busy: boolean; onPublish: (body: Record<string, unknown>) => Promise<void> }) {
  return <form className="publish-card" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); onPublish({ action: 'publish_proof', eventId: Number(form.get('eventId')), kind: form.get('kind'), title: form.get('title'), url: form.get('url'), source: form.get('source'), public: form.get('public') === 'on', redacted: form.get('redacted') === 'on' }).then(() => formElement.reset()) }}><FileCheck2 /><p className="care-eyebrow">05 · PROOF</p><h2>Close the loop.</h2><label>Care event<select name="eventId" required><option value="">Choose an event</option>{events.map((event) => <option value={event.event_id} key={event.event_id}>{event.title}</option>)}</select></label><label>Proof type<select name="kind"><option>video</option><option>photo</option><option>receipt</option><option>document</option><option>livestream</option></select></label><label>Title<input name="title" required maxLength={160} /></label><label>Secure URL<input name="url" type="text" required placeholder="https://… or /videos/…" /></label><label>Source<input name="source" placeholder="Sanctuary record" /></label><label className="care-check"><input type="checkbox" name="redacted" /> Sensitive details were redacted</label><label className="care-check"><input type="checkbox" name="public" /> Publish with the event</label><button disabled={busy}><FileCheck2 size={15} /> Attach proof</button></form>
}

createRoot(document.getElementById('root')!).render(<StrictMode><GardenAccountProvider><CaretakerRoom /></GardenAccountProvider></StrictMode>)
