import { ArrowRight, BadgeCheck, Bell, Check, CircleDollarSign, Clock3, ExternalLink, FileCheck2, Shield, Video, X } from 'lucide-react'
import type { SplotchNeed } from './data'
import type { GardenNotification, RealityFeed, RealityNeed } from './reality'

const statusLabels: Record<string, string> = {
  published: 'Published need',
  funding: 'Funding',
  funded: 'Funded',
  ordered: 'Ordered',
  in_progress: 'In progress',
  verified: 'Verified in Cyprus',
}

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

function findDonationNeed(need: RealityNeed, fallback: SplotchNeed[]): SplotchNeed | null {
  return fallback.find((item) => item.id === need.need_id) || null
}

export function RealityThread({
  feed,
  loading,
  error,
  notifications,
  onMarkRead,
  onClose,
  onDonate,
  donationNeeds,
}: {
  feed: RealityFeed | null
  loading: boolean
  error: string | null
  notifications: GardenNotification[]
  onMarkRead: (notificationId: number) => void
  onClose: () => void
  onDonate: (need: SplotchNeed) => void
  donationNeeds: SplotchNeed[]
}) {
  const latest = feed?.events[0]
  return (
    <div className="portal-backdrop reality-thread-backdrop" role="presentation">
      <article className="reality-thread" role="dialog" aria-modal="true" aria-labelledby="thread-title">
        <button className="close-button" onClick={onClose} aria-label="Close live sanctuary record"><X size={19} /></button>
        <header className="thread-hero">
          <div>
            <p className="eyebrow">LIVE WINDOW TO CYPRUS · AUDITABLE CARE</p>
            <h2 id="thread-title">What crossed the screen.</h2>
            <p>Real sanctuary events appear here only after they are recorded. Missing facts remain visibly missing; game fiction never fills the gap.</p>
          </div>
          <div className="thread-signal"><i /><span>LAST VERIFIED SIGNAL</span><strong>{latest?.title || (loading ? 'Opening the sanctuary record…' : 'No signal yet')}</strong><small>{feed?.asOf ? `Checked ${new Date(feed.asOf).toLocaleString()}` : error || 'Connecting'}</small></div>
        </header>

        <section className="truth-boundary" aria-label="Virtual and real currency boundary">
          <Shield size={23} />
          <div><strong>Virtual tokens remain game currency.</strong><span>Real money is never represented as fictional currency or treated as something the player “spent” on an imaginary object.</span></div>
        </section>

        <div className="thread-columns">
          <section className="thread-timeline">
            <div className="thread-section-title"><div><p className="eyebrow">SANCTUARY DISPATCHES</p><h3>Recorded events</h3></div><span><Clock3 size={13} /> newest first</span></div>
            {loading && <p className="thread-empty">Loading the live sanctuary record…</p>}
            {error && !feed && <p className="thread-empty">{error}</p>}
            {feed?.events.map((event) => {
              const proofs = feed.proofs.filter((proof) => proof.event_id === event.event_id)
              return (
                <article className="thread-event" key={event.event_id}>
                  <span className="event-mark"><Check size={14} /></span>
                  <div>
                    <small>{event.event_type.replace('.', ' · ').toUpperCase()} · {new Date(event.occurred_at).toLocaleDateString()}</small>
                    <h4>{event.title}</h4>
                    <p>{event.detail}</p>
                    {proofs.map((proof) => <a href={proof.url} key={proof.proof_id}><FileCheck2 size={13} /> {proof.title} {proof.url.startsWith('http') && <ExternalLink size={11} />}</a>)}
                  </div>
                </article>
              )
            })}
          </section>

          <section className="thread-needs">
            <div className="thread-section-title"><div><p className="eyebrow">REAL CARE NEEDS</p><h3>Funding is not fulfillment</h3></div><span><BadgeCheck size={13} /> separate states</span></div>
            <div className="thread-need-list">
              {feed?.needs.map((need) => {
                const donationNeed = findDonationNeed(need, donationNeeds)
                const total = need.received_cents
                const hasGoal = typeof need.goal_cents === 'number' && need.goal_cents > 0
                return (
                  <article key={need.need_id}>
                    <header><span>{statusLabels[need.fulfillment_status] || need.fulfillment_status}</span><b>{need.status}</b></header>
                    <h4>{need.title}</h4>
                    <p>{need.detail}</p>
                    <div className="need-money-states">
                      <span><small>RECEIVED</small><strong>{dollars(total)}</strong></span>
                      <span><small>AWAITING REVIEW</small><strong>{dollars(need.pending_cents)}</strong></span>
                      <span><small>ALLOCATED</small><strong>{dollars(need.allocated_cents)}</strong></span>
                    </div>
                    {hasGoal && <div className="need-goal"><i style={{ width: `${Math.min(100, (need.allocated_cents / (need.goal_cents || 1)) * 100)}%` }} /><span>{dollars(need.goal_cents || 0)} reviewed goal</span></div>}
                    <details><summary>Where overflow goes</summary><p>{need.overflow_policy}</p></details>
                    {donationNeed && need.status !== 'fulfilled' && <button onClick={() => onDonate(donationNeed)}><CircleDollarSign size={14} /> Support this real need</button>}
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <section className="thread-notifications">
          <div className="thread-section-title"><div><p className="eyebrow">YOUR RETURN SIGNALS</p><h3>Something you helped make real</h3></div><span><Bell size={13} /> account updates</span></div>
          {notifications.length === 0 && <p className="thread-empty">Sign in to carry Splotch’s verified updates between devices.</p>}
          <div>
            {notifications.slice(0, 6).map((notice) => (
              <button className={notice.read ? 'read' : ''} key={notice.notification_id} onClick={() => onMarkRead(notice.notification_id)}>
                <i />
                <span><strong>{notice.title}</strong><small>{notice.body}</small></span>
                {notice.action_url?.includes('Splotch') ? <Video size={15} /> : <ArrowRight size={15} />}
              </button>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}
