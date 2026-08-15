import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CalendarDays,
  Camera,
  Check,
  CircleDollarSign,
  CircleHelp,
  Coins,
  Droplets,
  ExternalLink,
  Gift,
  Heart,
  Home,
  Eye,
  Landmark,
  Leaf,
  LockKeyhole,
  MoonStar,
  MessageCircle,
  MousePointer2,
  PawPrint,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Sparkles,
  UserRound,
  Users,
  Utensils,
  Video,
  WalletCards,
  X,
} from 'lucide-react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import catGardensMark from '../assets/cat-gardens-icon.png'
import splotchImage from '../assets/splotch.jpg'
import mathikoloniGardenShell from '../assets/mathikoloni-garden-shell.webp'
import mathikoloniAerialPlot from '../assets/mathikoloni-aerial-plot.webp'
import mathikoloniVisionSource from '../assets/mathikoloni-vision-source.webp'
import { badgeLabels, cats, dreamGardenConcept, dreamSpaces, splotchNeeds, type SplotchNeed } from './data'
import { tvChannels, tvFundingNeeds } from './catGardensTv'
import { useGardenAccount } from './account'
import { GameSync } from './GameSync'
import { RealityThread } from './RealityThread'
import { playPurr } from './game/audio'
import { foodPrice, getDailyProgress, getObjective, getRelationshipText, localDay, shelterBuildCatalog, upgradeCatalog, useGame, type DonationBadge, type GardenUpgrade, type PersonId } from './game/store'
import { episodeFor, useGardenNotifications, useRealityFeed } from './reality'

const MATHIKOLONI_LISTING = 'https://www.bazaraki.com/adv/5818712_4-bedroom-detached-house-for-sale/'
const MATHIKOLONI_CURRENT_IMAGE = mathikoloniVisionSource

const mathikoloniRealityViews = [
  {
    image: mathikoloniVisionSource,
    label: 'VISION SOURCE · EXACT VIEW',
    title: 'The transformation starts with this photograph.',
    detail: 'This real listing image is the exact viewpoint used to create the proposed sanctuary visualization. The comparison keeps reality and vision aligned instead of implying that future work already exists.',
  },
  {
    image: mathikoloniGardenShell,
    label: 'GARDENS + SHELL',
    title: 'The sanctuary is mostly garden.',
    detail: 'Palm, succulent and grass gardens already create distinct territories. The unfinished shell can become generous warm cat habitat, with shaded outdoor seating for visitors.',
  },
  {
    image: mathikoloniAerialPlot,
    label: 'SPACE + PROXIMITY',
    title: 'Secluded, expandable, closer to care.',
    detail: 'The aerial view shows room for multiple gardens and future expansion. The move is also intended to shorten today’s roughly 25-minute trip to Markos and Limassol Veterinary Clinic.',
  },
] as const

const mathikoloniTransformationZones = [
  { number: '01', title: 'Cat gardens first', detail: 'Preserve and expand the existing succulent, grass and palm gardens into the largest part of the sanctuary.' },
  { number: '02', title: 'Warm lower floor', detail: 'Complete the open shell as year-round indoor cat habitat, with quiet rooms, cuddleboxes and protected winter warmth.' },
  { number: '03', title: 'Resident care rooms', detail: 'Give full-time keepers private rooms close enough to hear, observe and respond to the cats day and night.' },
  { number: '04', title: 'Visitor terrace', detail: 'Turn the downstairs outdoor seating into a calm place for volunteers and guests to sit with the cats.' },
  { number: '05', title: 'Enclosed freedom', detail: 'Use the high walls and the road-above-site geometry to preserve indoor/outdoor life within a near-continuous safe boundary.' },
  { number: '06', title: 'Expansion court', detail: 'Reimagine the basketball court as supervised visitation, enrichment and future sanctuary capacity.' },
] as const

const CatGardenWorld = lazy(() => import('./World').then((module) => ({ default: module.CatGardenWorld })))

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
        <div className="mission-cat-stage mission-splotch-photo">
          <img src={splotchImage} alt="Splotch, the real orange male cat in Cyprus" />
          <div className="likeness-note">
            <span><i /> REAL CAT · CYPRUS</span>
            <strong>Splotch is a big orange adult male.</strong>
            <p>You will care for a stylized orange likeness, then open a portal to Splotch’s real photographs, updates, expenses, and dreams.</p>
          </div>
          <div className="visit-strip"><b>01</b><i /><span>Your first living garden</span></div>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">SPLOTCH · THE FIRST SEVEN DAYS · CYPRUS</p>
          <h1>What happens here<br />can become real.</h1>
          <p className="mission-lede">The cat is real. The garden is the interface. Build Splotch’s first virtual shelter, earn his trust, and watch verified sanctuary actions cross the screen from Cyprus.</p>
          <ol className="mission-steps">
            <li><span>01</span><div><strong>Find him</strong><small>Approach on his terms</small></div></li>
            <li><span>02</span><div><strong>Build</strong><small>Floor, walls, roof</small></div></li>
            <li><span>03</span><div><strong>Return</strong><small>Seven days, then a living garden</small></div></li>
          </ol>
          <div className="mission-entry-actions">
            <button className="primary-button" onClick={onStart}>Enter today’s garden <ArrowRight size={18} /></button>
            <a className="secondary-button" href="/cats">Meet the real cats</a>
            <a className="mission-about-link" href="/sanctuary">How the real sanctuary works</a>
          </div>
          <div className="entry-truth-boundary"><Shield size={17} /><p><strong>Virtual tokens remain game currency.</strong><span>Real money is never represented as fictional currency or treated as something the player “spent” on an imaginary object.</span></p></div>
          <p className="free-note"><Shield size={14} /> Splotch’s real care never depends on a player logging in. Your daily ritual grows the virtual garden; optional gifts support the real sanctuary.</p>
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
  const completedDays = useGame((state) => state.completedDays)
  const episode = episodeFor(completedDays)
  const dayLabel = completedDays >= 7 ? 'LIVING GARDEN' : `DAY ${episode.day}/7`
  return (
    <aside className="cat-status game-panel">
      <div className="cat-status-head">
        <span className="cat-status-avatar"><PawPrint size={24} /></span>
        <div><span>EASY MODE · {dayLabel} · MEMORY {Math.min(7, bondVisits + 1)}/7</span><strong>Splotch</strong><small>{getRelationshipText(trust)}</small></div>
      </div>
      <Vitals label="FULL" value={hunger} color="#efb55f" />
      <Vitals label="TRUST" value={trust} color="#dfff6c" />
      <Vitals label="SAFE" value={safety} color="#7ee1ce" />
    </aside>
  )
}

function ObjectiveCard() {
  const lastDailyClaim = useGame((state) => state.lastDailyClaim)
  const splotchDiscovered = useGame((state) => state.splotchDiscovered)
  const shelterStage = useGame((state) => state.shelterStage)
  const food = useGame((state) => state.food)
  const lastDayCompleted = useGame((state) => state.lastDayCompleted)
  const completedDays = useGame((state) => state.completedDays)
  const lastFedDate = useGame((state) => state.lastFedDate)
  const lastWateredDate = useGame((state) => state.lastWateredDate)
  const blanketLevel = useGame((state) => state.blanketLevel)
  const waterBowlLevel = useGame((state) => state.waterBowlLevel)
  const hasBonded = useGame((state) => state.hasBonded)
  const realityVisits = useGame((state) => state.realityVisits)
  const dreamVisits = useGame((state) => state.dreamVisits)
  const objective = getObjective({ lastDailyClaim, splotchDiscovered, shelterStage, food, lastDayCompleted, completedDays, lastFedDate, lastWateredDate, blanketLevel, waterBowlLevel, hasBonded, realityVisits, dreamVisits })
  const episode = episodeFor(completedDays)
  const dayLabel = completedDays >= 7 ? 'LIVING GARDEN' : `DAY ${episode.day}/7`
  return (
    <section className="objective-hud game-panel">
      <div className="objective-copy">
        <span>{dayLabel} · {episode.eyebrow}</span>
        <strong>{objective.title}</strong>
        <small>{episode.title} · {objective.detail}</small>
      </div>
      <div className="objective-count"><b>{objective.progress}</b><span>/ {objective.total}</span></div>
      <div className="objective-progress"><i style={{ width: `${(objective.progress / objective.total) * 100}%` }} /></div>
    </section>
  )
}

function Inventory() {
  const food = useGame((state) => state.food)
  const water = useGame((state) => state.waterUnits)
  const treats = useGame((state) => state.treats)
  const tokens = useGame((state) => state.gardenTokens)
  const carePoints = useGame((state) => state.carePoints)
  return (
    <aside className="inventory-hud game-panel">
      <div className="care-score"><span>GARDEN TOKENS</span><strong>{tokens.toLocaleString()}</strong><Coins size={15} /></div>
      <div className="inventory-items">
        <span><Utensils size={14} /> Food <b>{food}</b></span>
        <span><Droplets size={14} /> Water <b>{water}</b></span>
        <span><Heart size={14} /> Treats <b>{treats}</b></span>
      </div>
      <small className="care-points-line">{carePoints.toLocaleString()} care points</small>
      <small className="token-boundary-line"><Shield size={10} /> virtual game currency only</small>
    </aside>
  )
}

function DayEndButton({ onDream }: { onDream: () => void }) {
  const state = {
    lastDailyClaim: useGame((game) => game.lastDailyClaim),
    splotchDiscovered: useGame((game) => game.splotchDiscovered),
    shelterStage: useGame((game) => game.shelterStage),
    lastFedDate: useGame((game) => game.lastFedDate),
    lastWateredDate: useGame((game) => game.lastWateredDate),
    blanketLevel: useGame((game) => game.blanketLevel),
    waterBowlLevel: useGame((game) => game.waterBowlLevel),
    hasBonded: useGame((game) => game.hasBonded),
    realityVisits: useGame((game) => game.realityVisits),
    completedDays: useGame((game) => game.completedDays),
    lastDayCompleted: useGame((game) => game.lastDayCompleted),
  }
  const progress = getDailyProgress(state)
  if (state.lastDayCompleted === localDay()) return (
    <button className="end-day-button completed" onClick={onDream}><MoonStar size={16} /><span>Tonight’s dream</span><b>OPEN</b></button>
  )
  return (
    <button className={`end-day-button ${progress.ready ? 'ready' : ''}`} disabled={!progress.ready} onClick={onDream}>
      <MoonStar size={16} /><span>{progress.ready ? 'End today & dream' : 'Daily adventure'}</span><b>{progress.complete}/{progress.total}</b>
    </button>
  )
}

function MiniMap() {
  const [x, , z] = useGame((state) => state.playerPosition)
  const [catX, , catZ] = useGame((state) => state.catPosition)
  const shelterStage = useGame((state) => state.shelterStage)
  const lastDailyClaim = useGame((state) => state.lastDailyClaim)
  const completedDays = useGame((state) => state.completedDays)
  const realityVisits = useGame((state) => state.realityVisits)
  const dreamReady = useGame((state) => state.shelterStage >= 3 && state.hasFed && state.blanketLevel > 0 && state.waterBowlLevel > 0)
  // Match the fixed game camera: +Z is screen-up and +X is screen-left.
  const mapPoint = (px: number, pz: number) => ({ left: `${50 - (px / 44) * 100}%`, top: `${50 - (pz / 44) * 100}%` })
  return (
    <aside className="mini-map game-panel" aria-label="Garden map">
      <div className="map-title"><span>GARDEN MAP</span><small>N</small></div>
      <div className="map-field">
        <i className="map-road map-road-one" />
        <i className="map-road map-road-two" />
        <span className="map-marker map-cat" style={mapPoint(catX, catZ)} title="Splotch"><Heart size={10} /></span>
        <span className="map-marker map-build" style={mapPoint(3.25, 6.1)} title={shelterStage >= 3 ? 'The shelter you built' : 'Build site'}>{shelterStage >= 3 ? <Home size={10} /> : <Box size={10} />}</span>
        {lastDailyClaim !== localDay() && <span className="map-marker map-basket" style={mapPoint(1.8, -7.8)} title="Supply crate"><Gift size={10} /></span>}
        <span className="map-marker map-supply" style={mapPoint(-4.6, -7.3)} title="Food shelf"><Utensils size={10} /></span>
        <span className="map-marker map-food" style={mapPoint(-3.2, 3.6)} title="Young plant"><Leaf size={10} /></span>
        <span className="map-marker map-reality" style={mapPoint(9.4, -2.1)} title="Reality Portal"><Video size={10} /></span>
        {dreamReady && <span className="map-marker map-dream" style={mapPoint(-9.2, 7.2)} title="Dream Garden"><Sparkles size={10} /></span>}
        {completedDays >= 1 && <span className="map-marker map-person map-chanda" style={mapPoint(-4.8, .6)} title="Chanda"><UserRound size={10} /></span>}
        {completedDays >= 3 && realityVisits > 0 && <span className="map-marker map-person map-karen" style={mapPoint(6.8, 4.6)} title="Karen"><UserRound size={10} /></span>}
        {completedDays >= 6 && realityVisits > 0 && <span className="map-marker map-person map-kimberly" style={mapPoint(6.8, 8.1)} title="Kimberly"><UserRound size={10} /></span>}
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
      <small>SCREEN-RELATIVE<br />ARROWS · WASD · PAD</small>
    </div>
  )
}

function ActionButton({ onAction }: { onAction: () => void }) {
  const nearby = useGame((state) => state.nearby)
  const discovered = useGame((state) => state.splotchDiscovered)
  const shelterStage = useGame((state) => state.shelterStage)
  const food = useGame((state) => state.food)
  const water = useGame((state) => state.waterUnits)
  const tokens = useGame((state) => state.gardenTokens)
  const lastDailyClaim = useGame((state) => state.lastDailyClaim)
  const lastFedDate = useGame((state) => state.lastFedDate)
  const lastWateredDate = useGame((state) => state.lastWateredDate)
  const lastDayCompleted = useGame((state) => state.lastDayCompleted)
  const hasBonded = useGame((state) => state.hasBonded)
  const bondVisits = useGame((state) => state.bondVisits)
  const nextBuild = shelterBuildCatalog[shelterStage]
  const label = useMemo(() => {
    if (nearby === 'basket') return lastDailyClaim === localDay() ? 'Supply crate opened today' : 'Open the starter supply crate'
    if (nearby === 'build') return lastDailyClaim !== localDay()
      ? 'Open the supply crate first'
      : nextBuild ? `${nextBuild.title} · ${nextBuild.cost} tokens` : 'Shelter complete'
    if (nearby === 'home') return 'Open the shelter you built'
    if (nearby === 'supply') return lastDailyClaim !== localDay()
      ? 'Open today’s supply crate first'
      : food >= 3 ? 'Food bag full'
        : `Buy one Splotch meal · ${foodPrice} tokens`
    if (nearby === 'cat') {
      if (!discovered) return 'Sit low and let Splotch see you'
      if (shelterStage < 3) return 'Splotch is watching you build'
      if (lastFedDate !== localDay()) return food > 0 ? 'Feed virtual Splotch' : `Buy food at the supply shelf · ${foodPrice} tokens`
      if (!hasBonded) return 'Sit down & pet Splotch'
      return bondVisits >= 6 ? 'Sit with Splotch again' : `Spend time together · memory ${bondVisits + 2}`
    }
    if (nearby === 'plant') return lastWateredDate === localDay() ? 'Plant watered today' : water > 0 ? 'Water the young plant' : 'Open the morning basket first'
    if (nearby === 'chanda') return 'Talk with Chanda'
    if (nearby === 'karen') return 'Talk with Karen'
    if (nearby === 'kimberly') return 'Talk with Kimberly'
    if (nearby === 'reality') return 'Open Splotch’s Reality Portal'
    if (nearby === 'dream') return lastDayCompleted === localDay() ? 'Re-enter tonight’s dream' : 'Finish today to enter the dream'
    return null
  }, [bondVisits, discovered, food, hasBonded, lastDailyClaim, lastDayCompleted, lastFedDate, lastWateredDate, nearby, nextBuild, shelterStage, water])
  const enabled = nearby === 'basket'
    ? lastDailyClaim !== localDay()
    : nearby === 'build'
      ? lastDailyClaim === localDay() && Boolean(nextBuild) && tokens >= (nextBuild?.cost || 0)
      : nearby === 'home'
        ? true
        : nearby === 'supply'
          ? lastDailyClaim === localDay() && food < 3 && tokens >= foodPrice
          : nearby === 'cat'
    ? (!discovered || (shelterStage >= 3 && (lastFedDate === localDay() || food > 0)))
    : nearby === 'plant'
      ? lastWateredDate !== localDay() && water > 0
      : nearby === 'dream'
        ? lastDayCompleted === localDay()
        : Boolean(nearby)
  if (!label) return null
  return (
    <button className={`action-button ${enabled ? 'enabled' : ''}`} disabled={!enabled} onClick={onAction}>
      <span>{enabled ? 'E' : '!'}</span>{label}
    </button>
  )
}

function MorningBasketModal({ onClose }: { onClose: () => void }) {
  const claimed = useGame((state) => state.lastDailyClaim === localDay())
  const loginDays = useGame((state) => state.loginDays)
  const firstCrate = useGame((state) => state.completedDays === 0 && state.shelterStage === 0)
  const claim = useGame((state) => state.claimDailyBasket)
  const tokens = firstCrate ? 120 : 40
  return (
    <div className="story-backdrop morning-backdrop" role="presentation">
      <article className="morning-card" role="dialog" aria-modal="true" aria-labelledby="morning-title">
        <button className="close-button" onClick={onClose} aria-label="Close morning basket"><X size={19} /></button>
        <span className="morning-sun"><Gift /></span>
        <p className="eyebrow">{firstCrate ? 'STARTER SUPPLY CRATE' : 'MORNING SUPPLY CRATE'} · DAY {Math.max(1, loginDays + (claimed ? 0 : 1))}</p>
        <h2 id="morning-title">Something useful,<br />waiting for you.</h2>
        <p>{firstCrate ? 'This one-time starter crate is enough to build a basic shelter, buy Splotch’s first meal, add his bowl and blanket, and still make one caring choice yourself.' : 'Every new local day brings water, a happiness treat, and forty garden tokens. Food is purchased at the physical supply shelf so spending remains part of the game.'}</p>
        <div className="basket-items">
          <span><Box /> <b>{firstCrate ? 'Starter materials' : 'Daily supplies'}</b></span>
          <span><Droplets /> <b>1 water</b></span>
          <span><Heart /> <b>1 treat</b></span>
          <span><Coins /> <b>{tokens} tokens</b></span>
        </div>
        <button className="primary-button" disabled={claimed} onClick={() => { claim(); onClose() }}>{claimed ? 'Today’s crate is already open' : 'Open today’s supply crate'} <ArrowRight size={17} /></button>
        <small><Shield size={13} /> Miss a day and nothing bad happens. Real Splotch’s food, water, and safety never depend on this game.</small>
      </article>
    </div>
  )
}

const personCopy: Record<PersonId, { eyebrow: string; title: string; body: (name: string) => string; request: string }> = {
  chanda: {
    eyebrow: 'CHANDA · DAILY CARETAKER · FROM NEPAL',
    title: 'The bowls do not fill themselves.',
    body: (name) => `Hi, ${name}. I feed and pet the cats every day. Sometimes it is much more work than it looks—but it is easier when somebody notices what still needs doing.`,
    request: 'Could you water the young plant while I finish the bowls?',
  },
  karen: {
    eyebrow: 'KAREN · CO-FOUNDER · AMERICAN IN CYPRUS',
    title: 'Thank you for becoming part of this story.',
    body: (name) => `${name}, Kimberly and I have spent nearly half a million dollars caring for cats over the years. What matters here is that the real animals become knowable—not anonymous numbers.`,
    request: 'Meet Splotch. Then open his Reality Portal and see what is true today.',
  },
  kimberly: {
    eyebrow: 'KIMBERLY · CO-FOUNDER · AMERICAN IN CYPRUS',
    title: 'A safe garden is built by people who return.',
    body: (name) => `We are glad you are here, ${name}. Every visit, share, volunteer hour, and carefully directed gift can become part of a real cat’s safer life.`,
    request: 'Make this little garden yours, then come back tomorrow and keep growing it.',
  },
}

function PersonDialogue({ person, onClose }: { person: PersonId; onClose: () => void }) {
  const account = useGardenAccount()
  const visits = useGame((state) => state.npcVisits[person])
  const copy = personCopy[person]
  const firstName = account.name && account.name !== 'Garden Friend' ? account.name.split(' ')[0] : 'friend'
  return (
    <div className="story-backdrop person-backdrop" role="presentation">
      <article className={`person-dialogue person-${person}`} role="dialog" aria-modal="true" aria-labelledby="person-title">
        <button className="close-button" onClick={onClose} aria-label={`Close ${person} conversation`}><X size={19} /></button>
        <div className="person-portrait"><UserRound /><span>{person.charAt(0).toUpperCase()}</span><i /></div>
        <div className="person-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="person-title">{copy.title}</h2>
          <p>“{copy.body(firstName)}”</p>
          <div className="person-request"><MessageCircle size={18} /><span>{copy.request}</span></div>
          <button className="primary-button" onClick={onClose}>{person === 'chanda' ? 'I’ll help with the plant' : 'Keep walking'} <ArrowRight size={17} /></button>
          <small>Garden conversation {visits}. Dialogue is an in-game introduction based on each person’s real care role.</small>
        </div>
      </article>
    </div>
  )
}

const upgrades = Object.keys(upgradeCatalog) as GardenUpgrade[]

function GardenDesigner({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const account = useGardenAccount()
  const tokens = useGame((state) => state.gardenTokens)
  const shelterStage = useGame((state) => state.shelterStage)
  const blanket = useGame((state) => state.blanketLevel)
  const waterBowl = useGame((state) => state.waterBowlLevel)
  const cuddlebox = useGame((state) => state.cuddleboxLevel)
  const bench = useGame((state) => state.benchPlaced)
  const path = useGame((state) => state.pathStyle)
  const collar = useGame((state) => state.collarName)
  const shareRewardClaimed = useGame((state) => state.shareRewardClaimed)
  const purchase = useGame((state) => state.purchaseUpgrade)
  const claimShareReward = useGame((state) => state.claimShareReward)
  const [referral, setReferral] = useState<{ code: string; acceptedCount: number; rewardPerFriend: number; friendWelcomeTokens: number } | null>(null)
  useEffect(() => {
    if (!account.signedIn) return
    account.getToken().then((token) => token ? fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } }) : null)
      .then((response) => response?.ok ? response.json() : null)
      .then((payload) => { if (payload?.code) setReferral(payload) })
      .catch(() => undefined)
  }, [account.getToken, account.signedIn])
  const owned = (id: GardenUpgrade) => id === 'blanket' ? blanket > 0
    : id === 'simple-bowl' ? waterBowl > 0
      : id === 'automatic-bowl' ? waterBowl > 1
        : id === 'cuddlebox' ? cuddlebox > 1
          : id === 'bench' ? bench
            : id === 'gravel' ? path === 'gravel'
              : Boolean(collar)
  const share = async () => {
    const link = `${window.location.origin}/?invite=${referral?.code || 'splotch-garden'}`
    if (navigator.share) await navigator.share({ title: 'Meet Splotch in Cat Gardens', text: 'Come help me grow Splotch’s garden.', url: link }).catch(() => undefined)
    else await navigator.clipboard.writeText(link).catch(() => undefined)
    claimShareReward()
  }
  return (
    <div className="profile-backdrop designer-backdrop" role="presentation">
      <article className="garden-designer" role="dialog" aria-modal="true" aria-labelledby="designer-title">
        <button className="close-button" onClick={onClose} aria-label="Close garden designer"><X size={19} /></button>
        <header>
          <div><p className="eyebrow">GARDEN DESIGNER · SPLOTCH’S HOME</p><h2 id="designer-title">Make what you built feel like his.</h2><p>{shelterStage < 3 ? 'The shelter must have a floor, walls, and roof before home furnishings can be placed.' : 'Spend earned garden tokens on visible improvements. Your starter budget covers Splotch’s blanket and simple water bowl.'}</p></div>
          <div className="token-wallet"><Coins size={20} /><span>AVAILABLE</span><strong>{tokens}</strong><small>garden tokens</small></div>
        </header>
        <section className="upgrade-grid">
          {upgrades.map((id) => {
            const item = upgradeCatalog[id]
            const isOwned = owned(id)
            const needsShelter = shelterStage < 3 && ['blanket', 'simple-bowl', 'automatic-bowl', 'cuddlebox'].includes(id)
            return (
              <article className={isOwned ? 'owned' : ''} key={id}>
                <span>{id.includes('bowl') ? <Droplets /> : id === 'blanket' || id === 'cuddlebox' ? <Home /> : id === 'gravel' || id === 'bench' ? <Leaf /> : <Heart />}</span>
                <div><p>{isOwned ? 'IN YOUR GARDEN' : `${item.cost} TOKENS`}</p><h3>{item.title}</h3><small>{item.detail}</small></div>
                <button disabled={isOwned || needsShelter} onClick={() => {
                  if (id === 'collar') {
                    const name = window.prompt('What should the virtual collar say?', 'Garden Friend')
                    if (name) purchase(id, name)
                    return
                  }
                  purchase(id)
                }}>{isOwned ? <><Check size={14} /> Added</> : needsShelter ? 'Build the roof first' : tokens >= item.cost ? 'Add to garden' : `Need ${item.cost - tokens} more`}</button>
              </article>
            )
          })}
        </section>
        <section className="designer-bottom">
          <div className="friendship-grove">
            <p className="eyebrow">FRIENDSHIP GROVE · FIRST STEP</p>
            <h3>Splotch’s next friend begins with an invitation.</h3>
            <p>Share once for two treats and 25 tokens. Signed-in gardeners also receive 100 tokens per verified friend; each new friend starts with a 75-token welcome. No reward is issued for clicks or self-referrals.</p>
            {referral && <small className="referral-count"><b>{referral.acceptedCount}</b> verified {referral.acceptedCount === 1 ? 'friend' : 'friends'} joined</small>}
            <button onClick={account.signedIn ? share : account.openSignIn}>{account.signedIn ? shareRewardClaimed ? 'Share again · friend rewards stay active' : 'Share Splotch’s garden' : 'Sign in to create your invitation'}</button>
          </div>
          <div className="supporter-upgrade">
            <p className="eyebrow">REALITY BOUNDARY · OPTIONAL GIFT</p>
            <h3>Care for the real cats. Keep the game economy separate.</h3>
            <p>Virtual tokens remain game currency. A real gift can add a verified supporter badge and a transparent sanctuary record—but never tokens or an imaginary object.</p>
            <button onClick={() => onDonate(splotchNeeds.find((need) => need.id === 'food')!)}>Support real daily care</button>
          </div>
        </section>
      </article>
    </div>
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
      <button className="bonding-close" onClick={() => { useGame.getState().cancelBonding(); onCancel() }} aria-label="Stand up"><X size={18} /></button>
      <div className="bonding-copy">
        <span>SPLOTCH MEMORY {String(bondVisits + 1).padStart(2, '0')} · AT HIS LEVEL</span>
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
          <a className="secondary-button" href="/cats">Meet the real cats</a>
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
          <div className="reality-signal"><i /><span>VERIFIED DISPATCH</span><strong>Splotch’s first field video is live</strong><small>Published from the real Cat Gardens record</small></div>
        </header>

        <section className="reality-grid">
          <div className="real-media-slot">
            <video className="real-splotch-video" controls playsInline preload="metadata" poster="/videos/splotch-petting.jpg">
              <source src="/videos/splotch-petting.mp4" type="video/mp4" />
              Your browser does not support the Splotch video.
            </video>
            <div>
              <b>REAL SPLOTCH · FIRST VERIFIED VIDEO · 00:34</b>
              <h3>This is the cat in your garden.</h3>
              <p>Splotch is a big orange adult male who actively seeks affection. This real moment shows him approaching Karen for pets while his Cat Gardens friends gather nearby.</p>
              <span className="truth-chip"><Shield size={13} /> Real-life updates remain separate from game state</span>
              <a className="reality-watch-link" href="/Splotch">Open Splotch’s complete story <ArrowRight size={13} /></a>
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
          <div className="fulfillment-register">
            <div><p className="eyebrow">YOU FUNDED IT · WE DID IT</p><h3>Real-world fulfillment register</h3><span>A supporter sees the whole path: funded → assigned → purchased → delivered → completed → proof reviewed → supporter notified.</span></div>
            <ol>
              <li className="active"><b>01</b><span><strong>Safety tracker</strong>Device selection pending Markos and sanctuary review.</span><small>NOT YET FUNDED</small></li>
              <li><b>02</b><span><strong>One need, one cap</strong>After the approved tracker is funded, the need closes.</span><small>NO DUPLICATE PROMISE</small></li>
              <li><b>03</b><span><strong>Choice before rerouting</strong>Any alternate use requires clear supporter consent.</span><small>TRANSPARENT ROUTING</small></li>
            </ol>
          </div>
        </section>
      </article>
    </div>
  )
}

type FundingSummary = Record<string, { total: number; gifts: number; lastFundedAt: string | null }>

function CatGardensTv({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const [activeId, setActiveId] = useState(tvChannels[0].id)
  const [funding, setFunding] = useState<FundingSummary>({})
  const visitTv = useGame((state) => state.visitTv)
  const active = tvChannels.find((channel) => channel.id === activeId) || tvChannels[0]

  useEffect(() => {
    let cancelled = false
    visitTv(tvChannels[0].id)
    fetch('/api/funding-summary')
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (!cancelled && payload?.campaigns) setFunding(payload.campaigns) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [visitTv])

  const chooseChannel = (channelId: string) => {
    setActiveId(channelId)
    visitTv(channelId)
  }

  return (
    <div className="portal-backdrop tv-backdrop" role="presentation">
      <article className="cat-tv" role="dialog" aria-modal="true" aria-labelledby="cat-tv-title">
        <button className="close-button" onClick={onClose} aria-label="Close Cat Gardens TV"><X size={19} /></button>
        <header className="tv-header">
          <div>
            <p className="eyebrow">CAT GARDENS TV · VIRTUAL PET, REAL LIFE</p>
            <h2 id="cat-tv-title">Watch care happen.</h2>
            <p>Meet the cats in the game, then return here for sanctuary-reviewed windows into their real lives. Live channels, scheduled rituals, care alerts, and proof of fulfilled support all share one durable home.</p>
          </div>
          <div className="tv-safety"><Eye size={19} /><span>PUBLIC-SAFE BY DESIGN</span><strong>Delayed · no audio · privacy masked</strong><small>People, access points, roads, plates, and private rooms stay out of frame.</small></div>
        </header>

        <section className="tv-studio">
          <nav className="tv-channel-list" aria-label="Cat Gardens TV channels">
            {tvChannels.map((channel) => (
              <button className={active.id === channel.id ? 'active' : ''} key={channel.id} onClick={() => chooseChannel(channel.id)}>
                <span>{channel.kind === 'live' ? <Radio size={16} /> : <Play size={16} />}</span>
                <div><b>{channel.label}</b><small>{channel.schedule}</small></div>
                <i>{channel.youtubeId || channel.localVideo ? 'READY' : 'SLOT'}</i>
              </button>
            ))}
          </nav>
          <div className="tv-player-column">
            <div className="tv-player">
              {active.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?rel=0`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : active.localVideo ? (
                <video controls playsInline preload="metadata" poster={active.poster}>
                  <source src={active.localVideo} type="video/mp4" />
                  Your browser does not support this Cat Gardens video.
                </video>
              ) : (
                <div className="tv-holding">
                  <span><Camera size={42} /></span>
                  <p>{active.kind === 'live' ? 'LIVE CHANNEL CONNECTION' : 'VERIFIED EPISODE SLOT'}</p>
                  <h3>{active.title}</h3>
                  <small>This production-ready player will connect automatically when its YouTube URL or ID is added. Until then, it will never pretend that recorded or missing footage is live.</small>
                </div>
              )}
              <div className="tv-player-status"><i className={active.youtubeId || active.localVideo ? 'connected' : ''} /><span>{active.youtubeId ? active.kind === 'live' ? 'CHANNEL CONNECTED' : 'YOUTUBE + CAT GARDENS' : active.localVideo ? 'FIRST-PARTY VERIFIED FILM' : 'AWAITING FIRST SAFE FEED'}</span><b>{active.label}</b></div>
            </div>
            <div className="tv-program-copy">
              <div><p className="eyebrow">{active.label}</p><h3>{active.title}</h3><p>{active.description}</p>{active.watchPage && <a className="tv-watch-link" href={active.watchPage}>Open the dedicated video page <ArrowRight size={13} /></a>}</div>
              <span><b>+20 CARE</b> for today’s first Cat Gardens TV check-in</span>
            </div>
          </div>
        </section>

        <section className="tv-schedule">
          <div><span>01</span><b>Breakfast Live</b><small>Feeding, fresh water, supplements, observation</small></div>
          <div><span>02</span><b>Fluff Forecast</b><small>Gabriel + Poly trust, brushing, cooling</small></div>
          <div><span>03</span><b>Care Alerts</b><small>Reviewed needs, updates, and fulfilled support</small></div>
          <div><span>04</span><b>Today at Cat Gardens</b><small>A short human-approved daily dispatch</small></div>
        </section>

        <section className="tv-funding">
          <header><div><p className="eyebrow">FUND THE WINDOW · VERIFY THE RESULT</p><h3>Help Cat Gardens TV become real.</h3><p>Every campaign accepts secure support now. Verified totals come from the donation ledger; installation costs, purchases, completed work, and evidence remain separate so nothing fictional becomes a fundraising claim.</p></div><span><Users size={18} /> Public aggregate totals only—never donor identities</span></header>
          <div className="tv-funding-grid">
            {tvFundingNeeds.map((need) => {
              const summary = funding[need.id]
              return (
                <article key={need.id}>
                  <span>{need.eyebrow}</span>
                  <h4>{need.title}</h4>
                  <p>{need.detail}</p>
                  <div className="funding-proof"><b>${(summary?.total || 0).toLocaleString()}</b><small>{summary ? `${summary.gifts} verified ${summary.gifts === 1 ? 'gift' : 'gifts'}` : 'verified support will appear here'}</small></div>
                  <button onClick={() => onDonate(need)}>Support from ${need.suggestedAmount} <ArrowRight size={14} /></button>
                </article>
              )
            })}
          </div>
          <footer><Shield size={15} /><span>Cat Gardens is the public project. Gardens of St. Gertrude remains the legal nonprofit receiving donations. “Live,” “funded,” and “completed” labels appear only when the underlying state is verified.</span></footer>
        </section>
      </article>
    </div>
  )
}

function DreamGarden({ onClose, onDonate }: { onClose: () => void; onDonate: (need: SplotchNeed) => void }) {
  const discoveries = useGame((state) => state.dreamDiscoveries)
  const discoverDream = useGame((state) => state.discoverDream)
  const completedDays = useGame((state) => state.completedDays)
  const [chapter, setChapter] = useState<0 | 1 | 2>(0)
  const [reveal, setReveal] = useState(12)
  const [realityView, setRealityView] = useState(0)
  const dreamNeed = splotchNeeds.find((need) => need.id === 'mathikoloni')!
  const activeReality = mathikoloniRealityViews[realityView]
  const chapterCopy = [
    { label: 'REALITY', title: 'Why this land.', detail: 'See the safety already present' },
    { label: 'TRANSFORMATION', title: 'How it changes.', detail: 'Explore the garden-first plan' },
    { label: 'DREAM', title: 'Who it protects.', detail: 'Enter Splotch’s future' },
  ] as const
  return (
    <div className={`dream-screen dream-chapter-${chapter}`} role="dialog" aria-modal="true" aria-labelledby="dream-title">
      {chapter === 0 && <img className="dream-background current-property" src={activeReality.image} alt={activeReality.title} />}
      {chapter === 1 && (
        <div className="dream-comparison">
          <img src={MATHIKOLONI_CURRENT_IMAGE} alt="The real Mathikoloni listing photograph used as the source for the proposed sanctuary visualization" />
          <div className="dream-reveal" style={{ width: `${reveal}%` }}><img src={dreamGardenConcept} alt="Proposed Cat Gardens transformation of the Mathikoloni property" /></div>
          <i style={{ left: `${reveal}%` }}><span>DRAG</span></i>
          <input aria-label="Compare the current property with the proposed Cat Gardens transformation" type="range" min="12" max="88" value={reveal} onChange={(event) => setReveal(Number(event.target.value))} />
        </div>
      )}
      {chapter === 2 && <img className="dream-background" src={dreamGardenConcept} alt="Proposed visualization of Splotch’s future sanctuary at the Mathikoloni property" />}
      <div className="dream-shade" />
      <header className="dream-header">
        <div><p>NIGHT {Math.max(1, completedDays)} · SPLOTCH’S DREAM · {chapter + 1}/3</p><h2 id="dream-title">{chapterCopy[chapter].title}</h2></div>
        <button onClick={onClose}><X size={20} /> Wake gently</button>
      </header>
      <nav className="dream-chapters" aria-label="Mathikoloni dream chapters">
        {chapterCopy.map((item, index) => (
          <button className={chapter === index ? 'active' : ''} onClick={() => setChapter(index as 0 | 1 | 2)} key={item.label}>
            <b>0{index + 1}</b><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight size={16} />
          </button>
        ))}
      </nav>
      <div className="concept-disclosure"><Shield size={14} /><span><b>{chapter === 0 ? 'CURRENT PROPERTY PHOTOGRAPH' : 'PROPOSED FUTURE VISUALIZATION'}</b>{chapter === 0 ? ' Public listing imagery documents the existing land.' : ' The transformation is an illustrated proposal, not completed work.'} Cat Gardens does not own this property. <a href={MATHIKOLONI_LISTING} target="_blank" rel="noreferrer">Source</a></span></div>
      {chapter === 0 && (
        <section className="property-facts">
          <p className="eyebrow">REALITY · WHY THIS SITE CHANGES THE ODDS</p>
          <h3>{activeReality.title}</h3>
          <p>{activeReality.detail}</p>
          <div className="reality-proof-grid"><span><b>Road above</b>not beside the cats</span><span><b>High walls</b>near-continuous boundary</span><span><b>3 gardens</b>already established</span><span><b>Open shell</b>room to build well</span></div>
          <button onClick={() => setChapter(1)}>See the transformation <ArrowRight size={15} /></button>
        </section>
      )}
      {chapter === 0 && <section className="reality-gallery" aria-label="Existing Mathikoloni property features">
        {mathikoloniRealityViews.map((view, index) => (
          <button className={realityView === index ? 'active' : ''} onClick={() => setRealityView(index)} key={view.label}>
            <img src={view.image} alt="" /><span><small>0{index + 1} · {view.label}</small><strong>{view.title}</strong></span>
          </button>
        ))}
      </section>}
      {chapter === 1 && (
        <section className="transformation-story">
          <p className="eyebrow">TRANSFORMATION · A GARDEN-FIRST SANCTUARY</p>
          <h3>The house supports the care. The gardens are the heart.</h3>
          <p>Move the line across the property, then explore the six practical conversions that turn existing strengths into a safer daily life.</p>
          <div className="transformation-zones">
            {mathikoloniTransformationZones.map((zone) => <article key={zone.number}><b>{zone.number}</b><div><strong>{zone.title}</strong><small>{zone.detail}</small></div></article>)}
          </div>
          <button onClick={() => setChapter(2)}>Enter tonight’s dream <ArrowRight size={15} /></button>
        </section>
      )}
      {chapter === 2 && <section className="dream-discoveries">
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
      </section>}
      {chapter === 2 && <aside className="dream-give">
        <p>The dream is free to enter · the work is real</p>
        <strong>Help build the next piece of safety.</strong>
        <div><button onClick={() => onDonate(dreamNeed)}><Landmark size={17} /> Fund the transformation</button></div>
      </aside>}
      <div className="dream-next">{chapter < 2 ? <button onClick={() => setChapter((chapter + 1) as 1 | 2)}>{chapter === 0 ? 'See transformation' : 'Enter the dream'} <ArrowRight size={15} /></button> : <button onClick={onClose}>Keep Splotch’s dream <MoonStar size={15} /></button>}</div>
    </div>
  )
}

function CareRoster({ onClose }: { onClose: () => void }) {
  return (
    <div className="profile-backdrop roster-backdrop" role="presentation">
      <article className="care-roster" role="dialog" aria-modal="true" aria-labelledby="roster-title">
        <button className="close-button" onClick={onClose} aria-label="Close cat care roster"><X size={19} /></button>
        <header><p className="eyebrow">REAL CATS · DIFFERENT CARE LOADS</p><h2 id="roster-title">Choose responsibility with your eyes open.</h2><p>Splotch is the welcoming easy-mode relationship. Advanced companions ask players to learn a real, reviewed care routine; they never imply that missing a login caused harm.</p></header>
        <section className="roster-grid">
          {cats.map((cat) => (
            <article className={`roster-cat roster-${cat.difficulty}`} key={cat.id}>
              {cat.image ? <img src={cat.image} alt={`${cat.name}, a real Cat Gardens cat`} /> : <div className="roster-photo-pending" style={{ '--cat-color': cat.color } as React.CSSProperties}><PawPrint size={35} /><b>{cat.name.charAt(0)}</b><span>REAL PHOTO PENDING</span></div>}
              <div><span>{cat.status === 'active' ? 'CURRENTLY ACTIVE' : 'MEMORIAL'} · {cat.difficulty.toUpperCase()} MODE</span><h3>{cat.name}</h3><b>{cat.nickname}</b><p>{cat.careSummary}</p>{cat.relationships && <div className="cat-relationships">{cat.relationships.map((relationship) => <small key={relationship}>{relationship}</small>)}</div>}<ul>{cat.careTasks.map((task) => <li key={task}><Check size={12} />{task}</li>)}</ul>{cat.status === 'passed' ? <button disabled>Memorial profile in review</button> : cat.id === 'splotch' ? <button onClick={onClose}>Play with Splotch</button> : cat.id === 'mabel' ? <a className="roster-profile-link" href="/Mabel">Play with Mabel · profile first</a> : <button disabled>Play with {cat.name} · coming next</button>}</div>
            </article>
          ))}
        </section>
        <section className="life-status-policy"><Shield size={21} /><div><p className="eyebrow">WHEN A REAL ANIMAL DIES</p><h3>The truth arrives gently, clearly, and from a human.</h3><p>After sanctuary confirmation, attached players receive a reviewed notification that says plainly that the cat died, preserves the relationship as a memorial, and offers another companion only when they are ready. The notice will never blame a missed day or turn grief into a countdown donation.</p></div></section>
      </article>
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
        catId: need.catId || 'splotch',
        program: need.program || 'cat-care',
        email: account.email || undefined,
        donorName: account.signedIn ? account.name : undefined,
      }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.clientSecret) throw new Error(payload.error || 'Unable to open checkout.')
    return payload.clientSecret as string
  }, [account.email, account.getToken, account.name, account.signedIn, amount, frequency, need.badge, need.catId, need.id, need.program, need.title])

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
            <div className="donation-reward"><BadgeCheck size={24} /><div><span>SUPPORTER RECORD AFTER VERIFICATION</span><strong>{badgeLabels[frequency === 'monthly' ? 'garden-keeper' : need.badge]} · permanent care-record badge</strong><small>Real gifts are recorded in dollars and allocated by the sanctuary. They are never converted into garden tokens.</small></div></div>
            <div className="donation-allocation"><strong>Before you give</strong><p>If this need is already covered, the sanctuary will route the gift to the next published care need for this cat or to daily sanctuary care. The final allocation will appear in your care record.</p></div>
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
        <footer><Shield size={14} /> Virtual tokens remain game currency. Real money is never represented as fictional currency or treated as something the player “spent” on an imaginary object. Donations support Gardens of St. Gertrude, the legal nonprofit.</footer>
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
        <h2>Walk. Care. Return.</h2>
        <div className="control-list">
          <span><b>WASD / ARROWS</b> Walk through the garden</span>
          <span><b>CLICK + DRAG</b> Trackpad walking pad</span>
          <span><b>SHIFT</b> Run</span>
          <span><b>E / CLICK</b> Build, buy, water, care, or open</span>
          <span><b>DESIGN GARDEN</b> Furnish the shelter after its roof is built</span>
          <span><b>R</b> Return to the garden gate</span>
        </div>
        <button className="secondary-button full" onClick={() => { resetRover(); onClose() }}><RotateCcw size={16} /> Return caretaker to gate</button>
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
  const realityFeed = useRealityFeed('splotch')
  const gardenNotifications = useGardenNotifications(account)
  const started = useGame((state) => state.started)
  const notification = useGame((state) => state.notification)
  const setNotification = useGame((state) => state.setNotification)
  const setInput = useGame((state) => state.setInput)
  const start = useGame((state) => state.start)
  const resetRover = useGame((state) => state.resetRover)
  const bondingMode = useGame((state) => state.bondingMode)
  const bondVisits = useGame((state) => state.bondVisits)
  const lastDailyClaim = useGame((state) => state.lastDailyClaim)
  const splotchDiscovered = useGame((state) => state.splotchDiscovered)
  const shelterStage = useGame((state) => state.shelterStage)
  const completedDays = useGame((state) => state.completedDays)
  const realityVisits = useGame((state) => state.realityVisits)
  const [bondResult, setBondResult] = useState<{ advanced: boolean; visit: number } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [realityOpen, setRealityOpen] = useState(false)
  const [threadOpen, setThreadOpen] = useState(false)
  const [tvOpen, setTvOpen] = useState(false)
  const [dreamOpen, setDreamOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [morningOpen, setMorningOpen] = useState(false)
  const [personOpen, setPersonOpen] = useState<PersonId | null>(null)
  const [donationNeed, setDonationNeed] = useState<SplotchNeed | null>(null)
  const [requestedCompanion] = useState(() => new URLSearchParams(window.location.search).get('companion'))
  useEffect(() => {
    if (!started || !requestedCompanion || requestedCompanion === 'splotch') return
    const cat = cats.find((candidate) => candidate.id === requestedCompanion || candidate.name.toLowerCase() === requestedCompanion.toLowerCase())
    if (!cat) return
    setRosterOpen(true)
    setNotification(cat.status === 'passed'
      ? `${cat.name} is remembered here. Memorial profiles never become play pressure.`
      : `${cat.name} is now in the relationship roster. Their playable routine is being prepared from real sanctuary records.`)
  }, [requestedCompanion, setNotification, started])
  useEffect(() => {
    if (!realityFeed.feed) return
    useGame.getState().setVerifiedRealityArtifacts(realityFeed.feed.worldArtifacts)
  }, [realityFeed.feed])
  useEffect(() => {
    if (!account.loaded || !account.signedIn) return
    const code = new URLSearchParams(window.location.search).get('invite')?.toUpperCase() || ''
    if (!/^[A-F0-9]{12}$/.test(code) || window.sessionStorage.getItem(`cat-gardens-referral-${code}`)) return
    account.getToken().then((token) => token ? fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    }) : null).then(async (response) => {
      if (!response) return
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Invitation could not be accepted.')
      window.sessionStorage.setItem(`cat-gardens-referral-${code}`, 'seen')
      if (payload.accepted) {
        useGame.setState((state) => ({ gardenTokens: Math.max(state.gardenTokens, Number(payload.tokenBalance || 0)), notification: `Friend invitation accepted · ${payload.inviteeTokens} welcome tokens` }))
      }
    }).catch(() => undefined)
  }, [account.getToken, account.loaded, account.signedIn])
  const handleAction = useCallback(() => {
    const game = useGame.getState()
    if (game.nearby === 'basket') {
      game.claimDailyBasket()
      return
    }
    if (game.nearby === 'build') {
      game.buildShelter()
      return
    }
    if (game.nearby === 'home') {
      setDesignerOpen(true)
      return
    }
    if (game.nearby === 'supply') {
      game.buyFood()
      return
    }
    if (game.nearby === 'cat') {
      if (!game.splotchDiscovered) {
        game.discoverSplotch()
        return
      }
      if (game.shelterStage < 3) {
        game.setNotification('Splotch is watching. Finish the shelter before dinner.')
        return
      }
      if (game.lastFedDate !== localDay() && game.feedDaily()) {
        window.setTimeout(playPurr, 650)
        return
      }
      game.beginBonding()
    }
    if (game.nearby === 'plant') game.waterPlant()
    if (game.nearby === 'chanda' || game.nearby === 'karen' || game.nearby === 'kimberly') {
      game.visitPerson(game.nearby)
      setPersonOpen(game.nearby)
    }
    if (game.nearby === 'reality') setRealityOpen(true)
    if (game.nearby === 'dream') {
      if (game.lastDayCompleted === localDay()) setDreamOpen(true)
      else game.setNotification('Finish today’s care adventure to enter Splotch’s dream.')
    }
  }, [])

  const finishDay = useCallback(() => {
    if (useGame.getState().completeDay()) setDreamOpen(true)
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
    setThreadOpen(false)
    setTvOpen(false)
    setDreamOpen(false)
    setProfileOpen(false)
    setRosterOpen(false)
    setDesignerOpen(false)
    setDonationNeed(need)
  }, [])

  const paused = !started || bondResult || helpOpen || realityOpen || threadOpen || tvOpen || dreamOpen || profileOpen || rosterOpen || designerOpen || morningOpen || personOpen || donationNeed

  return (
    <main className={`game-shell ${paused ? 'is-paused' : ''} ${bondingMode ? 'is-bonding' : ''}`}>
      <GameSync />
      <div className="world-canvas">
        <Suspense fallback={<div className="world-loading"><i /><span>Growing Splotch’s living garden…</span></div>}>
          <CatGardenWorld />
        </Suspense>
      </div>

      <header className="game-header game-panel">
        <a className="game-brand" href="/" aria-label="Cat Gardens home"><img src={catGardensMark} alt="" /><span>CAT GARDENS</span><small>SPLOTCH · {completedDays >= 7 ? 'LIVING GARDEN' : `DAY ${episodeFor(completedDays).day}/7`} · MEMORY {Math.min(7, bondVisits + 1)}/7</small></a>
        <nav>
          {completedDays > 0 && <button className="tv-nav" onClick={() => setTvOpen(true)}><Radio size={17} /><span>Cat Gardens TV</span></button>}
          {splotchDiscovered && <button className="reality-nav" onClick={() => setRealityOpen(true)}><Video size={17} /><span>Reality</span></button>}
          <button className="thread-nav" onClick={() => setThreadOpen(true)}><BadgeCheck size={17} /><span>Live record</span>{gardenNotifications.unread > 0 && <b>{gardenNotifications.unread}</b>}</button>
          <button className="cats-nav" onClick={() => setRosterOpen(true)}><PawPrint size={17} /><span>Cats</span></button>
          {shelterStage >= 3 && <button className="design-nav" onClick={() => setDesignerOpen(true)}><Leaf size={17} /><span>Design Garden</span></button>}
          <button className="profile-nav" onClick={() => setProfileOpen(true)}><UserRound size={17} /><span>My Profile</span></button>
          <button className="gift-nav" onClick={() => setMorningOpen(true)}><Gift size={17} /><span>{lastDailyClaim === localDay() ? 'Basket' : 'Free Gift'}</span></button>
          <button className="help-nav" onClick={() => setHelpOpen(true)}><CircleHelp size={17} /><span>Help</span></button>
          {realityVisits > 0 && <button className="donate-nav" onClick={() => setDonationNeed(splotchNeeds.find((need) => need.id === 'food')!)}><CircleDollarSign size={17} /> Donate</button>}
        </nav>
      </header>

      {started && !bondingMode && (
        <>
          <CatCard />
          <ObjectiveCard />
          <Inventory />
          <DayEndButton onDream={finishDay} />
          <MiniMap />
          <DrivePad />
          <ActionButton onAction={handleAction} />
          <button className="reset-rover" onClick={resetRover}><RotateCcw size={15} /> Return to gate <kbd>R</kbd></button>
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
      {morningOpen && <MorningBasketModal onClose={() => setMorningOpen(false)} />}
      {personOpen && <PersonDialogue person={personOpen} onClose={() => setPersonOpen(null)} />}
      {bondResult && <BondResultModal result={bondResult} onClose={() => setBondResult(null)} />}
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      {tvOpen && <CatGardensTv onClose={() => setTvOpen(false)} onDonate={openDonation} />}
      {realityOpen && <RealityPortal onClose={() => setRealityOpen(false)} onDonate={openDonation} />}
      {threadOpen && <RealityThread feed={realityFeed.feed} loading={realityFeed.loading} error={realityFeed.error} notifications={gardenNotifications.notifications} onMarkRead={gardenNotifications.markRead} onClose={() => setThreadOpen(false)} onDonate={openDonation} donationNeeds={splotchNeeds} />}
      {dreamOpen && <DreamGarden onClose={() => setDreamOpen(false)} onDonate={openDonation} />}
      {rosterOpen && <CareRoster onClose={() => setRosterOpen(false)} />}
      {designerOpen && <GardenDesigner onClose={() => setDesignerOpen(false)} onDonate={openDonation} />}
      {profileOpen && <GardenProfile onClose={() => setProfileOpen(false)} onDonate={openDonation} />}
      {donationNeed && <DonationDrawer need={donationNeed} onClose={() => setDonationNeed(null)} />}
    </main>
  )
}
