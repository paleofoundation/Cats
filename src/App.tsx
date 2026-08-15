import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, ChevronRight, Compass, ExternalLink, Heart, House, Map, ShieldCheck, Sparkles, X } from 'lucide-react'
import type { Focus } from './World'
import { cats, places, type Cat, type Place } from './data'
import catGardensMark from '../assets/cat-gardens-icon.png'

const CatGardenWorld = lazy(() => import('./World').then((module) => ({ default: module.CatGardenWorld })))

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function Entry({ onEnter, onJournal }: { onEnter: () => void; onJournal: () => void }) {
  return (
    <section className="entry-screen">
      <div className="entry-atmosphere" />
      <header className="entry-header">
        <a className="brand" href="/" aria-label="Cat Gardens home">
          <img src={catGardensMark} alt="" />
          <span>CAT GARDENS</span>
        </a>
        <span className="legal-note">A project of Gardens of St. Gertrude · Cyprus</span>
      </header>
      <div className="entry-copy">
        <p className="kicker">A REAL-WORLD SANCTUARY GAME</p>
        <h1>Build the garden<br />they should already have.</h1>
        <p className="entry-lede">Every cat is real. Every need is real. What changes in this world will eventually be tied to verified care in theirs.</p>
        <div className="entry-actions">
          <button className="button button-primary" onClick={onEnter}>Enter Cat Gardens <ArrowRight size={17} /></button>
          <button className="button button-ghost" onClick={onJournal}>Open the field journal <BookOpen size={17} /></button>
        </div>
        <div className="entry-facts" aria-label="Cat Gardens principles">
          <span><i>01</i> Free to explore</span>
          <span><i>02</i> Real cats and needs</span>
          <span><i>03</i> Proof before progress</span>
        </div>
      </div>
      <div className="entry-sun" />
      <div className="entry-hill entry-hill-back" />
      <div className="entry-hill entry-hill-front" />
      <div className="entry-cat" aria-hidden="true"><span /><i /><b /></div>
    </section>
  )
}

function CompanionPicker({ selected, onSelect, onClose }: { selected: Cat; onSelect: (cat: Cat) => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="companion-modal" role="dialog" aria-modal="true" aria-labelledby="companion-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close companion selection"><X /></button>
        <p className="kicker">YOUR FIRST RELATIONSHIP</p>
        <h2 id="companion-title">Choose a garden companion.</h2>
        <p className="modal-intro">The first roster favors distinctive personalities, documented stories, varied care paths, and cats we can keep updating honestly. You can change companions at any time.</p>
        <div className="cat-grid">
          {cats.map((cat) => (
            <button key={cat.id} className={`cat-card ${selected.id === cat.id ? 'selected' : ''}`} onClick={() => onSelect(cat)}>
              <img src={cat.image} alt={cat.name} />
              <span className="cat-card-copy">
                <small>{cat.role}</small>
                <strong>{cat.name}</strong>
                <em>{cat.nickname}</em>
                <p>{cat.story}</p>
                <b>{selected.id === cat.id ? 'Your companion' : 'Choose this cat'} <ChevronRight size={15} /></b>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function FieldJournal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop journal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="journal-modal" role="dialog" aria-modal="true" aria-labelledby="journal-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close field journal"><X /></button>
        <p className="kicker">FIELD NOTE 001</p>
        <h2 id="journal-title">This is a game about consequences.</h2>
        <div className="journal-columns">
          <div>
            <h3>What is real</h3>
            <p>The cats, the Cyprus hazards, the people doing the work, and the need for food, medical care, shelter, safe land, and paid caretaking.</p>
          </div>
          <div>
            <h3>What is simulated</h3>
            <p>The map is an interpretive world. “Garden score” rewards learning; it is not money and does not claim a real-life outcome.</p>
          </div>
          <div>
            <h3>What changes later</h3>
            <p>Verified donations and expenses will unlock documented improvements only after payment and fulfillment data are reconciled.</p>
          </div>
        </div>
        <div className="nonprofit-strip"><ShieldCheck /> <span>Donations are received by Gardens of St. Gertrude, the legal nonprofit entity behind Cat Gardens.</span></div>
        <button className="button button-primary" onClick={onClose}>I understand <ArrowRight size={17} /></button>
      </section>
    </div>
  )
}

function Portal({ place, onClose, onEarn }: { place: Place; onClose: () => void; onEarn: () => void }) {
  useEffect(() => { onEarn() }, [onEarn])
  return (
    <aside className="portal-panel" aria-live="polite">
      <button className="icon-button portal-close" onClick={onClose} aria-label="Close place briefing"><X /></button>
      {place.image && (
        <figure className="portal-image">
          <img src={place.image} alt={place.imageAlt ?? ''} />
          {place.imageNote && <figcaption>{place.imageNote}</figcaption>}
        </figure>
      )}
      <div className="portal-copy">
        <div className="portal-meta"><span>{place.eyebrow}</span><b>+{place.points} discovered</b></div>
        <h2>{place.title}</h2>
        <p className="portal-description">{place.description}</p>
        <p className="portal-detail">{place.detail}</p>
        <div className="portal-actions">
          {place.actions.map((action) => (
            <a key={action.label} className={`button ${action.primary ? 'button-primary' : 'button-outline'}`} href={action.href} target={action.external ? '_blank' : undefined} rel={action.external ? 'noreferrer' : undefined}>
              {action.label} {action.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
            </a>
          ))}
        </div>
        {place.actions.some((action) => action.href.includes('checkout')) && <small className="checkout-note">Secure checkout · donation receipts use the legal name Gardens of St. Gertrude.</small>}
      </div>
    </aside>
  )
}

export default function App() {
  const [entered, setEntered] = useState(() => readStored('catgardens-entered', false))
  const [journal, setJournal] = useState(false)
  const [picker, setPicker] = useState(false)
  const [companionId, setCompanionId] = useState(() => readStored('catgardens-companion', cats[0].id))
  const [visited, setVisited] = useState<string[]>(() => readStored('catgardens-visited', []))
  const [place, setPlace] = useState<Place | null>(null)
  const [focus, setFocus] = useState<Focus>('overview')
  const companion = useMemo(() => cats.find((cat) => cat.id === companionId) ?? cats[0], [companionId])
  const score = useMemo(() => places.filter((item) => visited.includes(item.id)).reduce((total, item) => total + item.points, 0), [visited])

  const enter = () => {
    setEntered(true)
    window.localStorage.setItem('catgardens-entered', 'true')
    if (!window.localStorage.getItem('catgardens-companion')) setPicker(true)
  }
  const selectCompanion = (cat: Cat) => {
    setCompanionId(cat.id)
    window.localStorage.setItem('catgardens-companion', JSON.stringify(cat.id))
    setPicker(false)
  }
  const earn = (id: string) => {
    setVisited((current) => {
      if (current.includes(id)) return current
      const next = [...current, id]
      window.localStorage.setItem('catgardens-visited', JSON.stringify(next))
      return next
    })
  }

  if (!entered) return <><Entry onEnter={enter} onJournal={() => setJournal(true)} />{journal && <FieldJournal onClose={() => setJournal(false)} />}</>

  return (
    <main className={`game-shell ${picker || journal || place ? 'has-overlay' : ''}`}>
      <div className="world-canvas">
        <Suspense fallback={<div className="world-loading"><span />Growing the garden…</div>}>
          <CatGardenWorld places={places} companion={companion} focus={focus} onOpen={setPlace} />
        </Suspense>
      </div>
      <header className="game-header glass-panel">
        <a className="brand" href="/" aria-label="Cat Gardens home"><img src={catGardensMark} alt="" /><span>CAT GARDENS</span></a>
        <nav aria-label="Site navigation">
          <button onClick={() => setJournal(true)}>How it works</button>
          <a href="/gallery.html">Real cats</a>
          <a href="/cat-crisis.html">Nonprofit</a>
          <a className="nav-donate" href="/donate.html">Donate</a>
        </nav>
      </header>
      <aside className="score-card glass-panel">
        <span className="score-label">GARDEN SCORE</span>
        <strong>{score.toLocaleString()}</strong>
        <small>{visited.length} of {places.length} places understood</small>
        <div className="score-line"><i style={{ width: `${(visited.length / places.length) * 100}%` }} /></div>
      </aside>
      <button className="companion-chip glass-panel" onClick={() => setPicker(true)}>
        <img src={companion.image} alt={companion.name} />
        <span><small>YOUR COMPANION</small><strong>{companion.name}</strong></span>
        <ChevronRight size={17} />
      </button>
      <aside className="objective-card glass-panel">
        <span className="score-label">CURRENT OBJECTIVE</span>
        <strong>{visited.length === 0 ? 'Find the real garden' : visited.length < places.length ? 'Follow the light markers' : 'You understand the ground'}</strong>
        <p>{visited.length === 0 ? 'Select the glowing marker on the lower garden.' : visited.length < places.length ? `${places.length - visited.length} briefings remain.` : 'Return soon—the real work keeps moving.'}</p>
      </aside>
      <div className="map-controls glass-panel" aria-label="Map views">
        <button className={focus === 'overview' ? 'active' : ''} onClick={() => setFocus('overview')}><Map size={16} /> Overview</button>
        <button className={focus === 'garden' ? 'active' : ''} onClick={() => setFocus('garden')}><Heart size={16} /> Today</button>
        <button className={focus === 'dream' ? 'active' : ''} onClick={() => setFocus('dream')}><House size={16} /> The dream</button>
      </div>
      <div className="control-hint"><Compass size={15} /> Drag to orbit · pinch or scroll to zoom · select a light</div>
      {place && <Portal place={place} onClose={() => setPlace(null)} onEarn={() => earn(place.id)} />}
      {picker && <CompanionPicker selected={companion} onSelect={selectCompanion} onClose={() => setPicker(false)} />}
      {journal && <FieldJournal onClose={() => setJournal(false)} />}
      {score === places.reduce((sum, item) => sum + item.points, 0) && <div className="completion-toast"><Sparkles /> The whole garden is now visible.</div>}
    </main>
  )
}
