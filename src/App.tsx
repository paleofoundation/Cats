import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CalendarDays,
  Check,
  CircleDollarSign,
  CircleHelp,
  ExternalLink,
  Heart,
  Home,
  Landmark,
  LockKeyhole,
  MousePointer2,
  PawPrint,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  UserRound,
  Utensils,
  Video,
  WalletCards,
  X,
} from 'lucide-react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import catGardensMark from '../assets/cat-gardens-icon.png'
import { badgeLabels, dreamGardenConcept, dreamSpaces, splotchNeeds, type SplotchNeed } from './data'
import { useGardenAccount } from './account'
import { GameSync } from './GameSync'
import { playBuild, playPurr } from './game/audio'
import { getObjective, getRelationshipText, useGame, type DonationBadge } from './game/store'

const CatGardenWorld = lazy(() => import('./World').then((module) => ({ default: module.CatGardenWorld })))

const foodMarkers = [[0, -3.2], [6.8, .5], [-5.8, 4.9]]
const partMarkers = [[10.4, 3.2], [-9.2, 2.4], [-8.1, 11.1], [8.8, 11.4]]
const bondMoments = [
  { title: 'Do less. Stay longer.', detail: 'Your caretaker has left the rover, lowered to Splotch’s level, and offered a hand. Press and hold. Trust is time—not tapping.', action: 'Hold to sit with Splotch', result: 'You stayed after the urgent work was over.' },
  { title: 'Let him see your hand.', detail: 'No food crate this time. Approach slowly, stop short, and give Splotch the choice to close the last distance.', action: 'Hold your hand still', result: 'You gave him control of the distance.' },
  { title: 'Learn his rhythm.', detail: 'Watch his ears, shoulders, and breathing. A relationship starts when the person notices what the animal is already saying.', action: 'Hold to observe quietly', result: 'You paid attention to his body language.' },
  { title: 'Make comfort familiar.', detail: 'Return without an emergency to solve. Familiar footsteps, a familiar posture, and an unhurried hand become their own kind of care.', action: 'Hold to keep the routine', result: 'Your return became part of the garden’s routine.' },
  { title: 'Stay for the ordinary.', detail: 'Nothing dramatic is happening. That is the point. Sit through the quiet part and let safety become boring.', action: 'Hold through the quiet', result: 'You stayed when there was nothing to collect.' },
  { title: 'Let him come to you.', detail: 'The last visit reverses the first: wait without summoning him. The relationship arc ends when Splotch chooses the final step.', action: 'Hold and wait for Splotch', result: 'He knew where to find you.' },
]

function StartMission({ onStart }: { onStart: () => void }) {
  return (
    <div className="mission-start">
      <section className="mission-card">
        <div className="mission-cat-stage">
          <div className="splotch-monogram"><PawPrint /><b>S</b></div>
          <div className="likeness-note">
            <span><i /> REAL CAT · CYPRUS</span>
            <strong>Splotch is a big adult male.</strong>
            <p>His accurate 3D likeness is being built from real references. The orange cat in the garden is a temporary game proxy—not Splotch’s final model.</p>
          </div>
          <div className="visit-strip"><b>∞</b><i /><span>A relationship begins here</span></div>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">SPLOTCH · EASY MODE · REAL CAT IN CYPRUS</p>
          <h1>Meet him now.<br />Keep knowing him.</h1>
          <p className="mission-lede">Splotch is a big, healthy adult boy who lives too close to a busy road. Care for him freely, meet him as a person, open his real-world portal—and, when he is warm enough to sleep, enter his dream.</p>
          <ol className="mission-steps">
            <li><span>01</span><div><strong>Care</strong><small>Food, warmth, attention</small></div></li>
            <li><span>02</span><div><strong>Know</strong><small>Real updates + expenses</small></div></li>
            <li><span>03</span><div><strong>Dream</strong><small>A safer Mathikoloni</small></div></li>
          </ol>
          <button className="primary-button" onClick={onStart}>Start the caretaker rover <ArrowRight size={18} /></button>
          <p className="free-note"><Shield size={14} /> The entire relationship and dream path are free. Donations fund real care, never access to Splotch.</p>
        </div>
      </section>
    </div>
  )
}

function Vitals({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="vital-row">
      <span>{label}</span>
      <div><i style={{ width: `${value}%`, backgroundColor: color }} /></div>
      <b>{value}</b>
    </div>
  )
}

function CatCard() {
  const hunger = useGame((state) => state.hunger)
  const trust = useGame((state) => state.trust)
  const safety = useGame((state) => state.safety)
  const bondVisits = useGame((state) => state.bondVisits)
  return (
    <aside className="cat-status game-panel">
      <div className="cat-status-head">
        <span className="cat-status-avatar"><PawPrint size={24} /></span>
        <div><span>EASY MODE · MEMORY {Math.min(7, bondVisits + 1)}/7 · THEN ∞</span><strong>Splotch</strong><small>{getRelationshipText(trust)}</small></div>
      </div>
      <Vitals label="FULL" value={hunger} color="#efb55f" />
      <Vitals label="TRUST" value={trust} color="#dfff6c" />
      <Vitals label="SAFE" value={safety} color="#7ee1ce" />
    </aside>
  )
}

function ObjectiveCard() {
  const foodFound = useGame((state) => state.foodFound)
  const hasFed = useGame((state) => state.hasFed)
  const hasBonded = useGame((state) => state.hasBonded)
  const partsFound = useGame((state) => state.partsFound)
  const shelterStage = useGame((state) => state.shelterStage)
  const bondVisits = useGame((state) => state.bondVisits)
  const realityVisits = useGame((state) => state.realityVisits)
  const dreamVisits = useGame((state) => state.dreamVisits)
  const objective = getObjective({ foodFound, hasFed, hasBonded, partsFound, shelterStage, bondVisits, realityVisits, dreamVisits })
  return (
    <section className="objective-hud game-panel">
      <div className="objective-copy">
        <span>{objective.chapter}</span>
        <strong>{objective.title}</strong>
        <small>{objective.detail}</small>
      </div>
      <div className="objective-count"><b>{objective.progress}</b><span>/ {objective.total}</span></div>
      <div className="objective-progress"><i style={{ width: `${(objective.progress / objective.total) * 100}%` }} /></div>
    </section>
  )
}

function Inventory() {
  const food = useGame((state) => state.food)
  const parts = useGame((state) => state.parts)
  const carePoints = useGame((state) => state.carePoints)
  return (
    <aside className="inventory-hud game-panel">
      <div className="care-score"><span>CARE</span><strong>{carePoints.toLocaleString()}</strong></div>
      <div className="inventory-items">
        <span><Utensils size={14} /> Food <b>{food}</b></span>
        <span><Box size={14} /> Parts <b>{parts}</b></span>
      </div>
    </aside>
  )
}

function MiniMap() {
  const [x, , z] = useGame((state) => state.playerPosition)
  const foodFound = useGame((state) => state.foodFound)
  const partsFound = useGame((state) => state.partsFound)
  const hasBonded = useGame((state) => state.hasBonded)
  const shelterStage = useGame((state) => state.shelterStage)
  const mapPoint = (px: number, pz: number) => ({ left: `${50 + (px / 44) * 100}%`, top: `${50 + (pz / 44) * 100}%` })
  return (
    <aside className="mini-map game-panel" aria-label="Garden map">
      <div className="map-title"><span>GARDEN MAP</span><small>N</small></div>
      <div className="map-field">
        <i className="map-road map-road-one" />
        <i className="map-road map-road-two" />
        <span className="map-marker map-cat" style={mapPoint(shelterStage === 4 ? 4.55 : .2, shelterStage === 4 ? 7.05 : 4.2)} title="Splotch"><Heart size={10} /></span>
        <span className="map-marker map-build" style={mapPoint(5.4, 7.2)} title="Shelter"><Home size={10} /></span>
        <span className="map-marker map-reality" style={mapPoint(10.8, -4.8)} title="Reality Portal"><Video size={10} /></span>
        {shelterStage === 4 && <span className="map-marker map-dream" style={mapPoint(-7.9, 8.7)} title="Dream Garden"><Sparkles size={10} /></span>}
        {foodMarkers.map(([px, pz], index) => !foodFound.includes(['food-olive', 'food-well', 'food-road'][index]) && (
          <span key={`food-${index}`} className="map-marker map-food" style={mapPoint(px, pz)} />
        ))}
        {hasBonded && partMarkers.map(([px, pz], index) => !partsFound.includes(['part-timber', 'part-roof', 'part-wall', 'part-cushion'][index]) && (
          <span key={`part-${index}`} className="map-marker map-part" style={mapPoint(px, pz)} />
        ))}
        <span className="map-player" style={mapPoint(x, z)}><i /></span>
      </div>
    </aside>
  )
}

function DrivePad() {
  const pad = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false })
  const setInput = useGame((state) => state.setInput)

  const update = (clientX: number, clientY: number) => {
    if (!pad.current) return
    const rect = pad.current.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    const radius = rect.width * .34
    const distance = Math.hypot(dx, dy) || 1
    const scale = Math.min(1, radius / distance)
    const x = dx * scale
    const y = dy * scale
    const nx = x / radius
    const ny = y / radius
    setKnob({ x, y, active: true })
    setInput({ forward: Math.max(0, -ny), backward: Math.max(0, ny), left: Math.max(0, -nx), right: Math.max(0, nx) })
  }

  const release = () => {
    setKnob({ x: 0, y: 0, active: false })
    setInput({ forward: 0, backward: 0, left: 0, right: 0 })
  }

  return (
    <div className="drive-control">
      <div
        ref={pad}
        className={`drive-pad ${knob.active ? 'active' : ''}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          update(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event.clientX, event.clientY) }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <span className="drive-cross">↑<i>←</i><b>→</b><em>↓</em></span>
        <span className="drive-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}><i /></span>
      </div>
      <small>CLICK + DRAG<br />OR WASD</small>
    </div>
  )
}

function ActionButton({ onAction }: { onAction: () => void }) {
  const nearby = useGame((state) => state.nearby)
  const food = useGame((state) => state.food)
  const parts = useGame((state) => state.parts)
  const hasFed = useGame((state) => state.hasFed)
  const hasBonded = useGame((state) => state.hasBonded)
  const shelterStage = useGame((state) => state.shelterStage)
  const bondVisits = useGame((state) => state.bondVisits)
  const nextBondAt = useGame((state) => state.nextBondAt)
  const label = useMemo(() => {
    if (nearby === 'cat') {
      if (!hasFed) return food >= 3 ? 'Feed Splotch' : `Find ${3 - food} more food`
      if (!hasBonded) return 'Stay & pet Splotch'
      if (shelterStage < 4) return 'Leave rover · sit with Splotch'
      if (bondVisits >= 6) return 'Sit with Splotch again'
      if (nextBondAt && Date.now() < nextBondAt) return 'Sit together—no points needed'
      return `Begin visit ${bondVisits + 2} on foot`
    }
    if (nearby === 'shelter') {
      if (!hasBonded) return 'Splotch needs you first'
      if (shelterStage === 4) return 'Shelter complete'
      return parts > 0 ? `Build shelter · ${shelterStage + 1}/4` : 'Find shelter parts'
    }
    if (nearby === 'reality') return 'Open Splotch’s Reality Portal'
    if (nearby === 'dream') return 'Enter Splotch’s Dream Garden'
    return null
  }, [bondVisits, food, hasBonded, hasFed, nearby, nextBondAt, parts, shelterStage])
  const enabled = nearby === 'cat'
    ? (hasFed || food >= 3)
    : nearby === 'shelter'
      ? hasBonded && parts > 0 && shelterStage < 4
      : nearby === 'reality' || nearby === 'dream'
  if (!label) return null
  return (
    <button className={`action-button ${enabled ? 'enabled' : ''}`} disabled={!enabled} onClick={onAction}>
      <span>{enabled ? 'E' : '!'}</span>{label}
    </button>
  )
}

function MemoryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="story-backdrop" role="presentation">
      <article className="story-card relationship-story" role="dialog" aria-modal="true" aria-labelledby="story-title">
        <button className="close-button" onClick={onClose} aria-label="Close Splotch's story"><X size={19} /></button>
        <div className="story-relationship-map">
          <span className="story-paw"><PawPrint size={38} /></span>
          <p>THE RELATIONSHIP HAS STARTED</p>
          <ol className="relationship-steps compact">
            <li className="complete"><b>01</b><span>Food + shelter</span></li>
            <li className="active"><b>02</b><span>Sit together</span></li>
            <li><b>03</b><span>Familiar hand</span></li>
            <li><b>04</b><span>Choose comfort</span></li>
            <li><b>05</b><span>Garden route</span></li>
            <li><b>06</b><span>Care journal</span></li>
            <li><b>07</b><span>He greets you</span></li>
          </ol>
        </div>
        <div className="story-copy">
          <p className="eyebrow">TRUST · 48</p>
          <h2 id="story-title">He learned the sound of your rover.</h2>
          <p>Splotch is a big orange boy. Food solved the immediate need. Staying is what starts the relationship.</p>
          <p>After the shelter is built, the rover stops being the hero. You step out, approach slowly, and sit with him yourself.</p>
          <button className="primary-button" onClick={onClose}>Build him somewhere dry <ArrowRight size={17} /></button>
        </div>
      </article>
    </div>
  )
}

function CompletionModal({ onClose, onBeginBond }: { onClose: () => void; onBeginBond: () => void }) {
  return (
    <div className="story-backdrop" role="presentation">
      <article className="complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <button className="close-button" onClick={onClose} aria-label="Keep playing"><X size={19} /></button>
        <span className="complete-mark"><Sparkles /></span>
        <p className="eyebrow">SPLOTCH IS WARM · THE WORLD OPENS</p>
        <h2 id="complete-title">This is not the end screen.</h2>
        <p>Splotch can sleep safely enough to dream. His Reality Portal now holds what is known today; the violet Dream Portal shows the future he deserves. You can also leave the rover and continue the relationship on foot.</p>
        <div className="seven-visit-preview"><b>1</b><i /><b>2</b><i /><span>3</span><i /><span>4</span><i /><span>5</span><i /><span>6</span><i /><span>7</span></div>
        <div className="complete-actions">
          <button className="primary-button" onClick={onBeginBond}><UserRound size={17} /> Sit with Splotch on foot</button>
          <button className="secondary-button" onClick={onClose}>Find the two portals</button>
        </div>
        <small>Donation remains optional and separate. First, the game earns the player’s care.</small>
      </article>
    </div>
  )
}

function BondingHUD({ onComplete, onCancel }: { onComplete: (result: { advanced: boolean; visit: number }) => void; onCancel: () => void }) {
  const bondVisits = useGame((state) => state.bondVisits)
  const moment = bondMoments[Math.min(bondVisits, bondMoments.length - 1)]
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const finishing = useRef(false)

  useEffect(() => {
    if (!holding) return
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 1.25)), 70)
    return () => window.clearInterval(timer)
  }, [holding])

  useEffect(() => {
    if (progress < 100 || finishing.current) return
    finishing.current = true
    setHolding(false)
    playPurr()
    const result = useGame.getState().completeBondVisit()
    if (result) window.setTimeout(() => onComplete(result), 450)
  }, [onComplete, progress])

  return (
    <section className="bonding-hud" aria-label="Sit with Splotch">
      <button className="bonding-close" onClick={() => { useGame.getState().cancelBonding(); onCancel() }} aria-label="Return to rover"><X size={18} /></button>
      <div className="bonding-copy">
        <span>VISIT {String(bondVisits + 2).padStart(2, '0')} · ON FOOT</span>
        <h2>{moment.title}</h2>
        <p>{moment.detail}</p>
      </div>
      <button
        className={`stay-button ${holding ? 'holding' : ''}`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setHolding(true) }}
        onPointerUp={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
      >
        <span className="stay-progress" style={{ '--stay': `${progress}%` } as React.CSSProperties}><MousePointer2 size={19} /></span>
        <strong>{progress >= 100 ? 'Moment saved.' : holding ? 'Stay…' : moment.action}</strong>
        <small>{Math.round(progress)}%</small>
      </button>
      <p className="bonding-note"><Shield size={13} /> Splotch remains safe if you leave. The game never manufactures neglect.</p>
    </section>
  )
}

function BondResultModal({ result, onClose }: { result: { advanced: boolean; visit: number }; onClose: () => void }) {
  const bondVisits = useGame((state) => state.bondVisits)
  const completedMoment = bondMoments[Math.max(0, Math.min(result.visit - 2, bondMoments.length - 1))]
  return (
    <div className="story-backdrop" role="presentation">
      <article className="bond-result-card" role="dialog" aria-modal="true" aria-labelledby="bond-result-title">
        <button className="close-button" onClick={onClose} aria-label="Return to garden"><X size={19} /></button>
        <span className="result-paw"><PawPrint /></span>
        <p className="eyebrow">{result.advanced ? `VISIT ${bondVisits + 1} SAVED · +35 CARE` : 'YOU STAYED ANYWAY'}</p>
        <h2 id="bond-result-title">{result.advanced ? completedMoment.result : 'Splotch had your attention, not another transaction.'}</h2>
        <p>{result.advanced ? 'The relationship now persists in this browser. His trust changed because you gave him time after the urgent work was over.' : 'There were no new points to collect. You sat with him because the relationship itself was worth returning to.'}</p>
        <div className="return-promise">
          <CalendarDays size={20} />
          <div><span>RELATIONSHIP STATUS</span><strong>{bondVisits >= 6 ? 'The first seven memories are saved. The relationship continues.' : 'The next memory is ready whenever you are.'}</strong><small>Nothing bad happens while you are away.</small></div>
        </div>
        <div className="complete-actions">
          <button className="primary-button" onClick={onClose}>Return to the garden <ArrowRight size={17} /></button>
          <a className="secondary-button" href="/gallery.html">Meet the real cats</a>
        </div>
      </article>
    </div>
  )
}

function RealityPortal({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const visitReality = useGame((state) => state.visitReality)
  useEffect(() => { visitReality() }, [visitReality])
  return (
    <div className="portal-backdrop reality-backdrop" role="presentation">
      <article className="reality-portal" role="dialog" aria-modal="true" aria-labelledby="reality-title">
        <button className="close-button" onClick={onClose} aria-label="Close Splotch’s Reality Portal"><X size={19} /></button>
        <header className="portal-header">
          <div>
            <p className="eyebrow">REALITY PORTAL · SPLOTCH · CYPRUS</p>
            <h2 id="reality-title">What is true today.</h2>
            <p>This portal only publishes sanctuary-reviewed information. Missing information stays visibly missing—it is never replaced by game fiction.</p>
          </div>
          <div className="reality-signal"><i /><span>UPDATE CHANNEL</span><strong>Awaiting Splotch’s first verified media pack</strong><small>Karen · Chanda · Markos contributor access planned</small></div>
        </header>

        <section className="reality-grid">
          <div className="real-media-slot">
            <span className="media-orbit"><PawPrint size={42} /></span>
            <div>
              <b>REAL SPLOTCH MEDIA SLOT</b>
              <h3>No substitute cat.</h3>
              <p>The current 3D orange cat remains labeled as a game proxy. Splotch’s actual photographs, video, body references and updates will appear here after Karen’s sanctuary upload.</p>
              <span className="truth-chip"><Shield size={13} /> Documentary evidence only</span>
            </div>
          </div>
          <div className="known-today">
            <p className="eyebrow">KNOWN TODAY</p>
            <ul>
              <li><Check size={15} /><span><b>Easy-mode first friend</b>Stable, social, no current health crisis reported.</span></li>
              <li><Check size={15} /><span><b>Big adult boy</b>The final 3D model must be built from his real proportions.</span></li>
              <li><Check size={15} /><span><b>Recent dental cleaning</b>Date and reviewed documentation are still pending.</span></li>
              <li><Shield size={15} /><span><b>Lives beside a busy road</b>Safety equipment and a safer home remain real needs.</span></li>
            </ul>
          </div>
        </section>

        <section className="ledger-section">
          <div className="section-title"><div><p className="eyebrow">SPLOTCH’S CARE LEDGER</p><h3>Every need has an evidence trail.</h3></div><span><LockKeyhole size={14} /> QuickBooks connection pending</span></div>
          <div className="need-grid">
            {splotchNeeds.map((need) => (
              <article className={`need-card need-${need.category}`} key={need.id}>
                <span>{need.eyebrow}</span>
                <h4>{need.title}</h4>
                <p>{need.detail}</p>
                <div><small>{need.status}</small>{need.category !== 'completed' && <button onClick={() => onDonate(need)}>Support from ${need.suggestedAmount}</button>}</div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}

function DreamGarden({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const discoveries = useGame((state) => state.dreamDiscoveries)
  const discoverDream = useGame((state) => state.discoverDream)
  const dreamNeed = splotchNeeds.find((need) => need.id === 'mathikoloni')!
  return (
    <div className="dream-screen" role="dialog" aria-modal="true" aria-labelledby="dream-title">
      <img className="dream-background" src={dreamGardenConcept} alt="Concept visualization of Splotch’s proposed future sanctuary in Mathikoloni" />
      <div className="dream-shade" />
      <header className="dream-header">
        <div><p>SPLOTCH’S DREAM · MATHIKOLONI</p><h2 id="dream-title">What safety could feel like.</h2></div>
        <button onClick={onClose}><X size={20} /> Wake gently</button>
      </header>
      <div className="concept-disclosure"><Shield size={14} /><span><b>PROPOSED FUTURE VISUALIZATION</b> Generated concept—not a photograph. Cat Gardens does not own this property.</span></div>
      <section className="dream-discoveries">
        <div className="dream-progress"><span>DREAM DISCOVERIES</span><strong>{discoveries.length} / {dreamSpaces.length}</strong><i><b style={{ width: `${(discoveries.length / dreamSpaces.length) * 100}%` }} /></i></div>
        <div className="dream-space-list">
          {dreamSpaces.map((space) => {
            const found = discoveries.includes(space.id)
            return (
              <button className={found ? 'found' : ''} key={space.id} onClick={() => discoverDream(space.id)}>
                <span>{found ? <Check size={14} /> : space.number}</span><div><strong>{space.title}</strong><small>{space.detail}</small></div><b>{found ? 'REMEMBERED' : '+20 CARE'}</b>
              </button>
            )
          })}
        </div>
      </section>
      <aside className="dream-give">
        <p>The dream is free to enter.</p>
        <strong>Help make one part real.</strong>
        <div><button onClick={() => onDonate(dreamNeed)}><Landmark size={17} /> Fund the big dream</button><a href="https://www.bazaraki.com/adv/5818712_4-bedroom-detached-house-for-sale/" target="_blank" rel="noreferrer">View actual listing <ExternalLink size={14} /></a></div>
      </aside>
    </div>
  )
}

function GardenProfile({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const account = useGardenAccount()
  const carePoints = useGame((state) => state.carePoints)
  const bondVisits = useGame((state) => state.bondVisits)
  const badges = useGame((state) => state.donationBadges)
  const donationTotal = useGame((state) => state.verifiedDonationTotal)
  const dreamDiscoveries = useGame((state) => state.dreamDiscoveries)
  const monthlyNeed = splotchNeeds.find((need) => need.id === 'food')!
  return (
    <div className="profile-backdrop" role="presentation">
      <article className="garden-profile" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="close-button" onClick={onClose} aria-label="Close garden profile"><X size={19} /></button>
        <header>
          <span className="profile-avatar">{account.imageUrl ? <img src={account.imageUrl} alt="" /> : <UserRound size={32} />}</span>
          <div><p className="eyebrow">MY GARDEN · PRIVATE CARETAKER PROFILE</p><h2 id="profile-title">{account.signedIn ? account.name : 'Save your relationship.'}</h2><p>{account.signedIn ? account.email : 'Play first. Sign in when you want Splotch’s relationship to follow you across devices.'}</p></div>
          {account.configured ? <button className="profile-account-button" onClick={account.signedIn ? account.openProfile : account.openSignIn}>{account.signedIn ? 'Manage account' : 'Sign in to save'}</button> : <span className="account-pending"><LockKeyhole size={14} /> Secure sign-in connection pending</span>}
        </header>
        <section className="profile-stats">
          <div><span>CARE POINTS</span><strong>{carePoints.toLocaleString()}</strong><small>game progress</small></div>
          <div><span>SPLOTCH MEMORIES</span><strong>{Math.min(7, bondVisits + 1)}</strong><small>then the relationship continues</small></div>
          <div><span>DREAM FOUND</span><strong>{dreamDiscoveries.length}/{dreamSpaces.length}</strong><small>free discoveries</small></div>
          <div><span>VERIFIED GIFTS</span><strong>${donationTotal.toLocaleString()}</strong><small>{account.signedIn ? 'synced from Stripe' : 'sign in to keep a record'}</small></div>
        </section>
        <section className="badge-vault">
          <div className="section-title"><div><p className="eyebrow">SUPPORTER BADGES</p><h3>Recognition follows verified payment.</h3></div><button onClick={() => onDonate(monthlyNeed)}>Become a Garden Keeper</button></div>
          <div className="badge-grid">
            {(Object.keys(badgeLabels) as DonationBadge[]).map((badge) => {
              const earned = badges.includes(badge)
              return <div className={earned ? 'earned' : ''} key={badge}><span><BadgeCheck size={25} /></span><strong>{badgeLabels[badge]}</strong><small>{earned ? 'Donation verified' : 'Not yet earned'}</small></div>
            })}
          </div>
        </section>
        <p className="profile-disclaimer"><Shield size={14} /> {account.signedIn ? 'Your relationship progress is synced securely across devices. Donation totals and badges come only from Stripe-verified payments.' : 'Guest progress stays on this device. Sign in to sync your relationship; Stripe remains the payment record.'}</p>
      </article>
    </div>
  )
}

function DonationDrawer({ need, onClose }: { need: SplotchNeed; onClose: () => void }) {
  const account = useGardenAccount()
  const [amount, setAmount] = useState(need.suggestedAmount)
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once')
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkoutReady, setCheckoutReady] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/payment-config')
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.publishableKey) throw new Error(payload.error || 'Secure checkout is not configured.')
        if (active) setStripePromise(loadStripe(payload.publishableKey))
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Secure checkout is unavailable.') })
    return () => { active = false }
  }, [])

  const fetchClientSecret = useCallback(async () => {
    const token = account.signedIn ? await account.getToken() : null
    const response = await fetch('/api/create-embedded-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        amount,
        frequency,
        needId: need.id,
        needTitle: need.title,
        badge: need.badge,
        email: account.email || undefined,
        donorName: account.signedIn ? account.name : undefined,
      }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.clientSecret) throw new Error(payload.error || 'Unable to open checkout.')
    return payload.clientSecret as string
  }, [account.email, account.getToken, account.name, account.signedIn, amount, frequency, need.badge, need.id, need.title])

  return (
    <div className="donation-backdrop" role="presentation">
      <aside className="donation-drawer" role="dialog" aria-modal="true" aria-labelledby="donation-title">
        <button className="close-button" onClick={onClose} aria-label="Close donation"><X size={19} /></button>
        <header><p className="eyebrow">REAL-WORLD SUPPORT · GARDENS OF ST. GERTRUDE</p><h2 id="donation-title">{need.title}</h2><p>{need.detail}</p><span>{need.status}</span></header>
        {!checkoutReady && (
          <section className="donation-setup">
            <div className="frequency-switch"><button className={frequency === 'once' ? 'active' : ''} onClick={() => setFrequency('once')}>Give once</button><button className={frequency === 'monthly' ? 'active' : ''} onClick={() => setFrequency('monthly')}>Monthly keeper</button></div>
            <label><span>Donation amount · USD</span><div><b>$</b><input value={amount} min="5" max="500000" type="number" onChange={(event) => setAmount(Math.max(5, Number(event.target.value)))} /></div></label>
            <div className="amount-options">{[10, 25, 50, 100].map((value) => <button className={amount === value ? 'active' : ''} key={value} onClick={() => setAmount(value)}>${value}</button>)}</div>
            <div className="donation-reward"><BadgeCheck size={24} /><div><span>YOU WILL EARN</span><strong>{badgeLabels[frequency === 'monthly' ? 'garden-keeper' : need.badge]}</strong><small>The badge lights only after Stripe confirms payment.</small></div></div>
            <button className="launch-checkout" disabled={!stripePromise || Boolean(error)} onClick={() => setCheckoutReady(true)}><WalletCards size={18} /> Continue to secure donation</button>
            {error && <p className="checkout-error">{error}</p>}
            <small className="wallet-note">Eligible devices will see Apple Pay. Stripe dynamically displays the available secure wallet and payment options.</small>
          </section>
        )}
        {checkoutReady && stripePromise && (
          <section className="embedded-checkout-shell">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </section>
        )}
        <footer><Shield size={14} /> Donations support the legal nonprofit. Final expense allocation and charitable acknowledgment language remain subject to sanctuary review.</footer>
      </aside>
    </div>
  )
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  const resetRover = useGame((state) => state.resetRover)
  const resetGame = useGame((state) => state.resetGame)
  return (
    <div className="help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="help-panel" role="dialog" aria-modal="true" aria-label="Game controls">
        <button className="close-button" onClick={onClose} aria-label="Close help"><X size={19} /></button>
        <p className="eyebrow">CARETAKER MANUAL</p>
        <h2>Drive. Care. Know him.</h2>
        <div className="control-list">
          <span><b>WASD / ARROWS</b> Drive and steer</span>
          <span><b>CLICK + DRAG</b> Trackpad drive pad</span>
          <span><b>SHIFT</b> Boost</span>
          <span><b>SPACE</b> Brake</span>
          <span><b>E</b> Care or build nearby</span>
          <span><b>R</b> Return rover to gate</span>
        </div>
        <button className="secondary-button full" onClick={() => { resetRover(); onClose() }}><RotateCcw size={16} /> Reset rover only</button>
        <button className="text-button" onClick={() => {
          if (window.confirm('Replay Splotch’s first day from the beginning?')) resetGame()
          onClose()
        }}>Replay the relationship opening</button>
        <a className="credits-link" href="/license/bruno-simon-folio-2025-MIT.txt" target="_blank" rel="noreferrer">Open-source credits <ExternalLink size={13} /></a>
      </aside>
    </div>
  )
}

export default function App() {
  const account = useGardenAccount()
  const started = useGame((state) => state.started)
  const notification = useGame((state) => state.notification)
  const setNotification = useGame((state) => state.setNotification)
  const setInput = useGame((state) => state.setInput)
  const start = useGame((state) => state.start)
  const resetRover = useGame((state) => state.resetRover)
  const bondingMode = useGame((state) => state.bondingMode)
  const bondVisits = useGame((state) => state.bondVisits)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [bondResult, setBondResult] = useState<{ advanced: boolean; visit: number } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [realityOpen, setRealityOpen] = useState(false)
  const [dreamOpen, setDreamOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [donationNeed, setDonationNeed] = useState<SplotchNeed | null>(null)
  const handleAction = useCallback(() => {
    const game = useGame.getState()
    if (game.nearby === 'cat') {
      if (!game.hasFed && game.feed()) {
        window.setTimeout(playPurr, 650)
        return
      }
      if (game.hasFed && !game.hasBonded && game.bond()) {
        playPurr()
        setMemoryOpen(true)
        return
      }
      if (game.hasBonded) {
        game.beginBonding()
      }
    }
    if (game.nearby === 'shelter') {
      const final = game.shelterStage === 3
      if (game.build()) {
        playBuild(final)
        if (final) {
          window.setTimeout(() => setCompletionOpen(true), 850)
        }
      }
    }
    if (game.nearby === 'reality') setRealityOpen(true)
    if (game.nearby === 'dream' && game.enterDream()) setDreamOpen(true)
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault()
      if (key === 'w' || key === 'arrowup') setInput({ forward: 1 })
      if (key === 's' || key === 'arrowdown') setInput({ backward: 1 })
      if (key === 'a' || key === 'arrowleft') setInput({ left: 1 })
      if (key === 'd' || key === 'arrowright') setInput({ right: 1 })
      if (key === 'shift') setInput({ boost: 1 })
      if (key === ' ') setInput({ brake: 1 })
      if (key === 'e' && !event.repeat) handleAction()
      if (key === 'r' && !event.repeat) resetRover()
    }
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'w' || key === 'arrowup') setInput({ forward: 0 })
      if (key === 's' || key === 'arrowdown') setInput({ backward: 0 })
      if (key === 'a' || key === 'arrowleft') setInput({ left: 0 })
      if (key === 'd' || key === 'arrowright') setInput({ right: 0 })
      if (key === 'shift') setInput({ boost: 0 })
      if (key === ' ') setInput({ brake: 0 })
    }
    const blur = () => setInput({ forward: 0, backward: 0, left: 0, right: 0, boost: 0, brake: 0 })
    window.addEventListener('keydown', down, { passive: false })
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [handleAction, resetRover, setInput])

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notification, setNotification])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('donation') !== 'complete') return
    const sessionId = query.get('session_id')
    if (!sessionId) return
    const sessionKey = `cat-gardens-verified-${sessionId}`
    if (window.localStorage.getItem(sessionKey)) {
      window.history.replaceState({}, '', window.location.pathname)
      setProfileOpen(true)
      return
    }
    account.getToken().then((token) => fetch(`/api/verify-donation-session?session_id=${encodeURIComponent(sessionId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }))
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.verified) throw new Error(payload.error || 'Donation verification is still pending.')
        const knownBadges = Object.keys(badgeLabels) as DonationBadge[]
        const badge = knownBadges.includes(payload.badge) ? payload.badge : 'bowl-bringer'
        useGame.getState().grantDonation(Number(payload.amount || 0), badge)
        window.localStorage.setItem(sessionKey, 'verified')
        setProfileOpen(true)
      })
      .catch(() => setNotification('Stripe is still confirming this donation. Your badge will appear after verification.'))
      .finally(() => window.history.replaceState({}, '', window.location.pathname))
  }, [account.getToken, setNotification])

  const openDonation = useCallback((need: SplotchNeed) => {
    setRealityOpen(false)
    setDreamOpen(false)
    setProfileOpen(false)
    setDonationNeed(need)
  }, [])

  const paused = !started || memoryOpen || completionOpen || bondResult || helpOpen || realityOpen || dreamOpen || profileOpen || donationNeed

  return (
    <main className={`game-shell ${paused ? 'is-paused' : ''} ${bondingMode ? 'is-bonding' : ''}`}>
      <GameSync />
      <div className="world-canvas">
        <Suspense fallback={<div className="world-loading"><i /><span>Loading the real first day…</span></div>}>
          <CatGardenWorld />
        </Suspense>
      </div>

      <header className="game-header game-panel">
        <a className="game-brand" href="/" aria-label="Cat Gardens home"><img src={catGardensMark} alt="" /><span>CAT GARDENS</span><small>SPLOTCH · MEMORY {Math.min(7, bondVisits + 1)}/7 · THEN ∞</small></a>
        <nav>
          <button onClick={() => setRealityOpen(true)}><Video size={17} /><span>Reality</span></button>
          <button onClick={() => setProfileOpen(true)}><UserRound size={17} /><span>My Garden</span></button>
          <button onClick={() => setHelpOpen(true)}><CircleHelp size={17} /><span>Help</span></button>
          <button className="donate-nav" onClick={() => setDonationNeed(splotchNeeds.find((need) => need.id === 'food')!)}><CircleDollarSign size={17} /> Donate</button>
        </nav>
      </header>

      {started && !bondingMode && (
        <>
          <CatCard />
          <ObjectiveCard />
          <Inventory />
          <MiniMap />
          <DrivePad />
          <ActionButton onAction={handleAction} />
          <button className="reset-rover" onClick={resetRover}><RotateCcw size={15} /> Reset rover <kbd>R</kbd></button>
          {notification && <div className="game-toast"><Sparkles size={16} />{notification}</div>}
        </>
      )}

      {bondingMode && (
        <BondingHUD
          onCancel={() => undefined}
          onComplete={(result) => setBondResult(result)}
        />
      )}

      {!started && <StartMission onStart={start} />}
      {memoryOpen && <MemoryModal onClose={() => setMemoryOpen(false)} />}
      {completionOpen && (
        <CompletionModal
          onClose={() => setCompletionOpen(false)}
          onBeginBond={() => {
            setCompletionOpen(false)
            useGame.getState().beginBonding()
          }}
        />
      )}
      {bondResult && <BondResultModal result={bondResult} onClose={() => setBondResult(null)} />}
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      {realityOpen && <RealityPortal onClose={() => setRealityOpen(false)} onDonate={openDonation} />}
      {dreamOpen && <DreamGarden onClose={() => setDreamOpen(false)} onDonate={openDonation} />}
      {profileOpen && <GardenProfile onClose={() => setProfileOpen(false)} onDonate={openDonation} />}
      {donationNeed && <DonationDrawer need={donationNeed} onClose={() => setDonationNeed(null)} />}
    </main>
  )
}
