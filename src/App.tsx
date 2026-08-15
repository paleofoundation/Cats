import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Box,
  CircleHelp,
  ExternalLink,
  Heart,
  Home,
  RotateCcw,
  Shield,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react'
import catGardensMark from '../assets/cat-gardens-icon.png'
import splotchPortrait from '../assets/splotch.jpg'
import { playBuild, playPurr } from './game/audio'
import { getObjective, useGame } from './game/store'

const CatGardenWorld = lazy(() => import('./World').then((module) => ({ default: module.CatGardenWorld })))

const foodMarkers = [[0, -3.2], [6.8, .5], [-5.8, 4.9]]
const partMarkers = [[10.4, 3.2], [-9.2, 2.4], [-8.1, 11.1], [8.8, 11.4]]

function StartMission({ onStart }: { onStart: () => void }) {
  return (
    <div className="mission-start">
      <section className="mission-card">
        <div className="mission-cat-photo">
          <img src={splotchPortrait} alt="Splotch, a real resident of Cat Gardens" />
          <span><i /> REAL CAT · CYPRUS</span>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">DAY ONE · SPLOTCH</p>
          <h1>She is hungry.<br />She does not know you yet.</h1>
          <p className="mission-lede">Drive the caretaker rover. Find food. Earn Splotch’s trust. Then build her somewhere dry to sleep.</p>
          <ol className="mission-steps">
            <li><span>01</span><div><strong>Recover</strong><small>Find 3 food crates</small></div></li>
            <li><span>02</span><div><strong>Care</strong><small>Feed her and stay</small></div></li>
            <li><span>03</span><div><strong>Build</strong><small>Make a real shelter</small></div></li>
          </ol>
          <button className="primary-button" onClick={onStart}>Start the caretaker rover <ArrowRight size={18} /></button>
          <p className="free-note"><Shield size={14} /> The complete first day is free. Caring is not a paywall.</p>
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
  return (
    <aside className="cat-status game-panel">
      <div className="cat-status-head">
        <img src={splotchPortrait} alt="Splotch" />
        <div><span>YOUR FIRST CAT</span><strong>Splotch</strong><small>{trust >= 70 ? 'She remembers you.' : trust > 0 ? 'She is learning your sound.' : 'She is watching from a distance.'}</small></div>
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
  const objective = getObjective({ foodFound, hasFed, hasBonded, partsFound, shelterStage })
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
  const mapPoint = (px: number, pz: number) => ({ left: `${50 + (px / 44) * 100}%`, top: `${50 + (pz / 44) * 100}%` })
  return (
    <aside className="mini-map game-panel" aria-label="Garden map">
      <div className="map-title"><span>GARDEN MAP</span><small>N</small></div>
      <div className="map-field">
        <i className="map-road map-road-one" />
        <i className="map-road map-road-two" />
        <span className="map-marker map-cat" style={mapPoint(.2, 4.2)} title="Splotch"><Heart size={10} /></span>
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
  const label = useMemo(() => {
    if (nearby === 'cat') {
      if (!hasFed) return food >= 3 ? 'Feed Splotch' : `Find ${3 - food} more food`
      if (!hasBonded) return 'Stay & pet Splotch'
      return 'Pet Splotch'
    }
    if (nearby === 'shelter') {
      if (!hasBonded) return 'Splotch needs you first'
      if (shelterStage === 4) return 'Shelter complete'
      return parts > 0 ? `Build shelter · ${shelterStage + 1}/4` : 'Find shelter parts'
    }
    return null
  }, [food, hasBonded, hasFed, nearby, parts, shelterStage])
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
      <article className="story-card" role="dialog" aria-modal="true" aria-labelledby="story-title">
        <button className="close-button" onClick={onClose} aria-label="Close Splotch's story"><X size={19} /></button>
        <div className="story-photo"><img src={splotchPortrait} alt="The real Splotch at the Cyprus sanctuary" /><span>MEMORY UNLOCKED · REAL SPLOTCH</span></div>
        <div className="story-copy">
          <p className="eyebrow">TRUST · 48</p>
          <h2 id="story-title">She learned the sound of your rover.</h2>
          <p>Splotch is red, radiant, and never finished being petted. Sit in the real garden and she will consider your lap public infrastructure.</p>
          <p>Food solved the immediate need. Staying is what started the relationship.</p>
          <button className="primary-button" onClick={onClose}>Build her somewhere dry <ArrowRight size={17} /></button>
        </div>
      </article>
    </div>
  )
}

function CompletionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="story-backdrop" role="presentation">
      <article className="complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <button className="close-button" onClick={onClose} aria-label="Keep playing"><X size={19} /></button>
        <span className="complete-mark"><Sparkles /></span>
        <p className="eyebrow">FIRST DAY COMPLETE</p>
        <h2 id="complete-title">You gave Splotch a better simulated day—for free.</h2>
        <p>The cat, the need for food, and the shelter work are real. A donation is optional. If you choose it, $10 supports daily care through Gardens of St. Gertrude, the legal nonprofit behind Cat Gardens.</p>
        <div className="complete-actions">
          <a className="primary-button" href="/checkout.html?amount=10&frequency=once&campaign=daily-care">Help a real cat today · $10 <ArrowRight size={17} /></a>
          <button className="secondary-button" onClick={onClose}>Keep exploring</button>
        </div>
        <small>No virtual shelter is represented as a completed real-world outcome without verification.</small>
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
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
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
        playPurr()
        game.setNotification('Splotch leans into your hand.')
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
    <main className={`game-shell ${!started || memoryOpen || completionOpen || helpOpen ? 'is-paused' : ''}`}>
      <div className="world-canvas">
        <Suspense fallback={<div className="world-loading"><i /><span>Loading the real first day…</span></div>}>
          <CatGardenWorld />
        </Suspense>
      </div>

      <header className="game-header game-panel">
        <a className="game-brand" href="/" aria-label="Cat Gardens home"><img src={catGardensMark} alt="" /><span>CAT GARDENS</span><small>FIRST DAY</small></a>
        <nav>
          <a href="/gallery.html">Real cats</a>
          <a href="/cat-crisis.html">Why Cyprus?</a>
          <button onClick={() => setHelpOpen(true)}><CircleHelp size={17} /><span>Help</span></button>
          <a className="donate-nav" href="/donate.html">Donate</a>
        </nav>
      </header>

      {started && (
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

      {!started && <StartMission onStart={start} />}
      {memoryOpen && <MemoryModal onClose={() => setMemoryOpen(false)} />}
      {completionOpen && <CompletionModal onClose={() => setCompletionOpen(false)} />}
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
    </main>
  )
}
