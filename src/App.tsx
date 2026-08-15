import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Box,
  CalendarDays,
  CircleHelp,
  ExternalLink,
  Heart,
  Home,
  MousePointer2,
  PawPrint,
  RotateCcw,
  Shield,
  Sparkles,
  UserRound,
  Utensils,
  X,
} from 'lucide-react'
import catGardensMark from '../assets/cat-gardens-icon.png'
import { playBuild, playPurr } from './game/audio'
import { getObjective, getRelationshipText, useGame } from './game/store'

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
          <div className="visit-strip"><b>01</b><i /><span>07 visits begin here</span></div>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">VISIT ONE · SPLOTCH</p>
          <h1>He is hungry.<br />He does not know you yet.</h1>
          <p className="mission-lede">Drive the caretaker rover. Find food. Earn Splotch’s trust. Build him somewhere dry—then come back as a person and let a relationship begin.</p>
          <ol className="mission-steps">
            <li><span>01</span><div><strong>Recover</strong><small>Find 3 food crates</small></div></li>
            <li><span>02</span><div><strong>Care</strong><small>Feed him and stay</small></div></li>
            <li><span>03</span><div><strong>Return</strong><small>Seven saved visits</small></div></li>
          </ol>
          <button className="primary-button" onClick={onStart}>Start the caretaker rover <ArrowRight size={18} /></button>
          <p className="free-note"><Shield size={14} /> The relationship path is free. Caring is not a paywall.</p>
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
        <div><span>YOUR FIRST RELATIONSHIP · {bondVisits + 1}/7</span><strong>Splotch</strong><small>{getRelationshipText(trust)}</small></div>
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
  const nextBondAt = useGame((state) => state.nextBondAt)
  const objective = getObjective({ foodFound, hasFed, hasBonded, partsFound, shelterStage, bondVisits, nextBondAt })
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
    return null
  }, [bondVisits, food, hasBonded, hasFed, nearby, nextBondAt, parts, shelterStage])
  const enabled = nearby === 'cat'
    ? (hasFed || food >= 3)
    : nearby === 'shelter' && hasBonded && parts > 0 && shelterStage < 4
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
        <p className="eyebrow">TUTORIAL COMPLETE · RELATIONSHIP BEGINS</p>
        <h2 id="complete-title">Now leave the rover and meet him.</h2>
        <p>One completed checklist is not trust. Visit two puts a human caretaker on the ground beside Splotch. Sit still, stay with him, and begin a relationship saved across visits.</p>
        <div className="seven-visit-preview"><b>1</b><i /><b>2</b><i /><span>3</span><i /><span>4</span><i /><span>5</span><i /><span>6</span><i /><span>7</span></div>
        <div className="complete-actions">
          <button className="primary-button" onClick={onBeginBond}><UserRound size={17} /> Begin visit two on foot</button>
          <button className="secondary-button" onClick={onClose}>Return to the garden</button>
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
  const nextBondAt = useGame((state) => state.nextBondAt)
  const bondVisits = useGame((state) => state.bondVisits)
  const completedMoment = bondMoments[Math.max(0, Math.min(result.visit - 2, bondMoments.length - 1))]
  const unlockLabel = nextBondAt ? new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(nextBondAt) : null
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
          <div><span>NEXT BOND MOMENT</span><strong>{bondVisits >= 6 ? 'The seven-visit arc is complete' : unlockLabel ?? 'Ready now'}</strong><small>Nothing bad happens while you are away.</small></div>
        </div>
        <div className="complete-actions">
          <button className="primary-button" onClick={onClose}>Return to the garden <ArrowRight size={17} /></button>
          <a className="secondary-button" href="/gallery.html">Meet the real cats</a>
        </div>
      </article>
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
        <h2>Drive. Care. Build.</h2>
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
        }}>Replay the whole first day</button>
        <a className="credits-link" href="/license/bruno-simon-folio-2025-MIT.txt" target="_blank" rel="noreferrer">Open-source credits <ExternalLink size={13} /></a>
      </aside>
    </div>
  )
}

export default function App() {
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

  return (
    <main className={`game-shell ${!started || memoryOpen || completionOpen || bondResult || helpOpen ? 'is-paused' : ''} ${bondingMode ? 'is-bonding' : ''}`}>
      <div className="world-canvas">
        <Suspense fallback={<div className="world-loading"><i /><span>Loading the real first day…</span></div>}>
          <CatGardenWorld />
        </Suspense>
      </div>

      <header className="game-header game-panel">
        <a className="game-brand" href="/" aria-label="Cat Gardens home"><img src={catGardensMark} alt="" /><span>CAT GARDENS</span><small>SPLOTCH · VISIT {bondVisits + 1}/7</small></a>
        <nav>
          <a href="/gallery.html">Real cats</a>
          <a href="/cat-crisis.html">Why Cyprus?</a>
          <button onClick={() => setHelpOpen(true)}><CircleHelp size={17} /><span>Help</span></button>
          <a className="donate-nav" href="/donate.html">Donate</a>
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
    </main>
  )
}
