import { useState } from 'react'
import { ArrowRight, Check, ExternalLink, Heart, Play, RefreshCw, Share2 } from 'lucide-react'
import { storyFor, type StoryFilm } from './catStories'
import type { GardenNotification, RealityFeed } from './reality'
import './cat-story.css'
import { careNeedsFor, type CareNeed } from './data'
import { isNativeGarden, shareGardenStory } from './native'

function Film({ film }: { film: StoryFilm }) {
  const [playing, setPlaying] = useState(false)
  return <article className="cat-film">
    <div className="cat-film-frame">
      {film.youtubeId ? playing ? <iframe src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`} title={film.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : <button onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`}><img src={film.poster} alt="" loading="lazy"/><span><Play size={24}/> Watch film</span></button>
        : <video controls playsInline preload="none" poster={film.poster}><source src={film.video} type="video/mp4"/></video>}
    </div>
    <div><h3>{film.title}</h3><p>{film.detail}</p>{film.youtubeId && <a href={`https://www.youtube.com/shorts/${film.youtubeId}`} target="_blank" rel="noopener noreferrer">Watch on YouTube <ExternalLink size={13}/></a>}</div>
  </article>
}

export default function CatStory({ catId, feed, loading, error, onRefresh, onDonate, onPlay, notifications = [], onMarkRead }: {
  catId: string; feed: RealityFeed | null; loading: boolean; error: string | null; onRefresh: () => void;
  onDonate: (need?: CareNeed) => void; onPlay?: () => void; notifications?: GardenNotification[]; onMarkRead?: (id: number) => void;
}) {
  const cat = storyFor(catId)
  const [shareState, setShareState] = useState('Share this story')
  const currentFeed = feed?.catId === catId ? feed : null
  const money = (cents: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
  const share = async () => {
    const url = `https://catgardens.org${cat.path}`
    try {
      await shareGardenStory(`${cat.fullName} · Cat Gardens`, url)
      if (!navigator.share && !isNativeGarden()) setShareState('Link copied')
    } catch (reason) { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setShareState('Copy the page address to share') }
  }
  return <div className="cat-story">
    <header className="cat-story-hero">
      <figure><img src={cat.portrait} alt={`${cat.fullName}, the real Cat Gardens cat in Cyprus`}/><figcaption>REAL CAT · CAT GARDENS, CYPRUS</figcaption></figure>
      <div className="cat-story-intro"><p className="cat-kicker">{cat.eyebrow}</p><h1>{cat.fullName}<span>A little life. A whole story.</span></h1><p>{cat.intro}</p>
        <div className="cat-story-actions">{onPlay ? <button className="cat-button" onClick={onPlay}>Return to the garden <ArrowRight size={17}/></button> : <a className="cat-button" href={`/?companion=${cat.id}`}>Play with {cat.name} <ArrowRight size={17}/></a>}<button className="cat-button subtle" onClick={()=>onDonate()}><Heart size={16}/> Support real care</button></div>
        <a className="cat-profile-link" href={onPlay ? cat.path : "#story"} title={`Open ${cat.name}’s story, films and care updates`}>{onPlay ? `Open ${cat.name}’s full page` : `Read ${cat.name}’s story`} <ArrowRight size={15}/></a>
      </div>
    </header>
    <nav className="cat-story-sections" aria-label={`${cat.name}’s story sections`}><a href="#story">The story</a><a href="#films">Films & photos</a><a href="#care">Daily care</a><a href="#updates">Latest updates</a><button onClick={share}><Share2 size={15}/><span aria-live="polite">{shareState}</span></button></nav>
    <section className="cat-story-chapter" id="story"><p className="cat-kicker">MEET THE CAT BEHIND YOUR COMPANION</p><h2>Every cat has a before.<br/>And a life still unfolding.</h2><p className="cat-story-prose">{cat.story}</p></section>
    <section className="cat-story-chapter" id="films"><div className="cat-section-heading"><div><p className="cat-kicker">THE REALITY PORTAL</p><h2>Little windows into {cat.name}’s world.</h2></div><span>Real photographs. Real moments.</span></div><div className="cat-films">{cat.films.map(film => <Film key={film.title} film={film}/>)}</div></section>
    <section className="cat-story-chapter cat-care-chapter" id="care"><div><p className="cat-kicker">THE CARE BEHIND THE STORY</p><h2>Ordinary care.<br/>An extraordinary difference.</h2><p>{cat.care}</p><ul>{cat.routines.map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul></div><aside><Heart size={30}/><h3>Help care for {cat.name}.</h3><p>Gifts support real sanctuary care. Published costs and completed care records appear below when the sanctuary has reviewed them.</p><strong>{currentFeed?.needs.some(need=>need.goal_cents) ? 'See reviewed goals in the care record below' : 'Reviewed costs not yet published'}</strong><p className="cat-small">A suggested gift is an amount you choose to give; it is not a quoted price for a meal or treatment.</p><button className="cat-button" onClick={()=>onDonate()}>Support real care <ArrowRight size={16}/></button></aside></section>
    {catId==='splotch' && <section className="cat-care-options" aria-label="Ways to support Splotch">{careNeedsFor(catId).map(need=><article key={need.id}><h3>{need.title}</h3><p>{need.detail}</p><small>{need.status}</small>{need.category!=='completed' && <button className="cat-button subtle" onClick={()=>onDonate(need)}>Support this need <ArrowRight size={14}/></button>}</article>)}</section>}
    <section className="cat-story-chapter" id="updates"><div className="cat-section-heading"><div><p className="cat-kicker">FROM THE SANCTUARY</p><h2>Latest updates & care records.</h2></div><button className="cat-refresh" disabled={loading} onClick={onRefresh}><RefreshCw size={15}/> Refresh</button></div>
      <p className="cat-record-note">These records describe the real sanctuary. Feeding or watering in the game does not create a real-world care record.</p>
      {loading && !currentFeed && <p role="status">Opening {cat.name}’s sanctuary record…</p>}
      {error && <p className="cat-record-error" role="status">Current updates are unavailable. {currentFeed ? 'Previously loaded records are shown below.' : 'The story and films remain available.'} Please try again when connected.</p>}
      {!loading && !error && !currentFeed?.events.length && <p className="cat-record-note">No new care updates have been published yet. {cat.name}’s photographs and films are above.</p>}
      <div className="cat-records">{currentFeed?.events.map(event=><article key={event.event_id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})}</time><h3>{event.title}</h3><p>{event.detail}</p>{currentFeed.proofs.filter(proof=>proof.event_id===event.event_id).map(proof=><a key={proof.proof_id} href={proof.url}>View {proof.title} <ArrowRight size={14}/></a>)}</article>)}</div>
      {!!currentFeed?.needs.length && <div className="cat-published-needs"><h3>Published care needs</h3>{currentFeed.needs.map(need=><article key={need.need_id}><div><h4>{need.title}</h4><p>{need.detail}</p><span>{need.fulfillment_status.replaceAll('_',' ')}</span></div><dl><div><dt>Received</dt><dd>{money(need.received_cents,need.currency)}</dd></div><div><dt>Allocated</dt><dd>{money(need.allocated_cents,need.currency)}</dd></div><div><dt>Awaiting allocation review</dt><dd>{money(need.pending_cents,need.currency)}</dd></div><div><dt>Reviewed goal</dt><dd>{need.goal_cents ? money(need.goal_cents,need.currency) : 'Not published yet'}</dd></div></dl><details><summary>How gifts are allocated</summary><p>{need.overflow_policy}</p></details></article>)}</div>}
      {currentFeed?.asOf && <p className="cat-small">Record checked {new Date(currentFeed.asOf).toLocaleString()}.</p>}
      {!!notifications.length && <div className="cat-notices"><h3>Your care updates</h3>{notifications.map(notice=><article key={notice.notification_id}><h4>{notice.title}</h4><p>{notice.body}</p>{notice.action_url && <a href={notice.action_url}>Open update <ArrowRight size={14}/></a>}{!notice.read && onMarkRead && <button onClick={()=>onMarkRead(notice.notification_id)}>Mark as read</button>}</article>)}</div>}
    </section>
    <footer className="cat-story-footer"><p>Cat Gardens is a project of Gardens of St. Gertrude, caring for real animals in Cyprus.</p><a href="/cats">Meet the other cats <ArrowRight size={15}/></a><a href="/app">Take the garden with you <ArrowRight size={15}/></a></footer>
  </div>
}
