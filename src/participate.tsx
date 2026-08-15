import { FormEvent, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign, HandHeart, HeartHandshake, LoaderCircle, MapPin, Shield, Sparkles, Users } from 'lucide-react'
import catGardensIcon from '../assets/cat-gardens-icon.png'
import volunteerHero from '../assets/hero_volunteer.jpg'
import './participate.css'

type RequestType = 'volunteer' | 'employment-interest' | 'skilled-remote'

const pathways = [
  { id: 'volunteer' as RequestType, icon: HandHeart, eyebrow: 'IN CYPRUS', title: 'Volunteer with the cats', detail: 'Help with feeding preparation, cleaning, brushing, trust-building, garden work, transport, or reviewed photography and video.' },
  { id: 'skilled-remote' as RequestType, icon: Sparkles, eyebrow: 'FROM ANYWHERE', title: 'Lend a professional skill', detail: 'Grant writing, fundraising, supply procurement, technology, editing, storytelling, research, logistics, and other remote work can remove real bottlenecks.' },
  { id: 'employment-interest' as RequestType, icon: BriefcaseBusiness, eyebrow: 'FUTURE PAID CARE', title: 'Express employment interest', detail: 'Tell us about your care experience and availability. This is an expression of interest—not a current job offer or guarantee of employment.' },
]

const interestOptions = [
  ['feeding', 'Feeding preparation'], ['cleaning', 'Cleaning and laundry'], ['cat-socialization', 'Petting and trust sessions'],
  ['brushing', 'Brushing and coat care'], ['garden-work', 'Garden and shelter work'], ['transport', 'Veterinary transport'],
  ['photo-video', 'Photography and video'], ['fundraising', 'Fundraising and events'], ['grant-writing', 'Grant writing'],
  ['technology', 'Technology and data'], ['supply-procurement', 'Supplies and procurement'], ['care-team', 'Paid care-team work'],
] as const

function ParticipationPortal() {
  const [requestType, setRequestType] = useState<RequestType>('volunteer')
  const [interests, setInterests] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const selectedPath = useMemo(() => pathways.find((path) => path.id === requestType)!, [requestType])

  const toggleInterest = (interest: string) => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setStatus('sending')
    setMessage('')
    const form = new FormData(formElement)
    try {
      const response = await fetch('/api/participation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType, interests, fullName: form.get('fullName'), email: form.get('email'), location: form.get('location'),
          availability: form.get('availability'), message: form.get('message'), website: form.get('website'), privacyConsent: form.get('privacyConsent') === 'on',
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.accepted) throw new Error(payload.error || 'Your request could not be saved.')
      setStatus('sent')
      setMessage('Your request is now in the real Cat Gardens review queue. A human will follow up at the email you provided.')
      formElement.reset()
      setInterests([])
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Your request could not be saved. Please try again.')
    }
  }

  return (
    <main className="join-page">
      <nav className="join-nav" aria-label="Cat Gardens"><a className="join-brand" href="/"><img src={catGardensIcon} alt="" />Cat Gardens</a><div><a href="/cats">Meet the cats</a><a href="/donate.html">Give</a><a className="join-play" href="/"><ArrowLeft size={14} /> Return to the game</a></div></nav>

      <header className="join-hero">
        <div><p className="join-eyebrow">REAL HELP · REAL RESPONSIBILITY</p><h1>The garden needs people.</h1><p>Every bowl, clean blanket, brushed coat, veterinary trip, safe enclosure, and published update depends on human time. Choose how you can enter the real work.</p></div>
        <figure><img src={volunteerHero} alt="A person caring for cats at Cat Gardens" /><figcaption><MapPin size={15} /> Parekklisia, Cyprus · remote help welcomed worldwide</figcaption></figure>
      </header>

      <section className="pathway-grid" aria-label="Ways to participate">
        {pathways.map((path) => { const Icon = path.icon; return <button className={requestType === path.id ? 'selected' : ''} onClick={() => { setRequestType(path.id); setStatus('idle'); setMessage('') }} key={path.id}><span><Icon size={21} /></span><small>{path.eyebrow}</small><h2>{path.title}</h2><p>{path.detail}</p><b>{requestType === path.id ? <><Check size={14} /> Selected</> : <>Choose pathway <ChevronRight size={14} /></>}</b></button> })}
      </section>

      <section className="join-layout">
        <div className="join-context">
          <p className="join-eyebrow">{selectedPath.eyebrow}</p><h2>{selectedPath.title}</h2><p>{selectedPath.detail}</p>
          <div className="care-truth"><Shield size={22} /><div><strong>Welfare and privacy come first.</strong><p>Not every task is available to every visitor. On-site access, cat handling, medical information, filming, and publication require sanctuary review and supervision.</p></div></div>
          <div className="human-funding"><Users size={25} /><div><small>THE MOST UNDERRATED NEED</small><h3>Fund the people who do the care.</h3><p>Reliable care requires reliable human hours. A donation can support the reviewed care-team allocation without implying that a fictional worker was purchased inside the game.</p><a href="/donate.html?program=care-team&frequency=monthly&amount=100"><CircleDollarSign size={15} /> Help fund the care team</a></div></div>
        </div>

        <form className="join-form" onSubmit={submit}>
          <header><span>PARTICIPATION REQUEST</span><h2>Tell the sanctuary what you can do.</h2><p>This form enters a private caretaker review queue. It does not publish your information.</p></header>
          <input className="form-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="field-row"><label><span>Full name</span><input name="fullName" required maxLength={120} autoComplete="name" /></label><label><span>Email</span><input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
          <label><span>Where are you based?</span><input name="location" maxLength={160} placeholder="City and country" autoComplete="country-name" /></label>
          <label><span>Availability</span><input name="availability" maxLength={240} placeholder="For example: Saturdays, three remote hours a week, or future full-time work" /></label>
          <fieldset><legend>How would you like to help?</legend><div className="interest-grid">{interestOptions.map(([value, label]) => <label className={interests.includes(value) ? 'checked' : ''} key={value}><input type="checkbox" checked={interests.includes(value)} onChange={() => toggleInterest(value)} /><span>{interests.includes(value) ? <Check size={13} /> : null}{label}</span></label>)}</div></fieldset>
          <label><span>Anything the care team should know?</span><textarea name="message" rows={5} maxLength={3000} placeholder="Experience, skills, languages, transport, limitations, or the kind of contribution you would like to make." /></label>
          <label className="consent"><input type="checkbox" name="privacyConsent" required /><span>I agree that Cat Gardens may store this information so the sanctuary can review and respond to my request. See the <a href="/privacy.html" target="_blank">privacy notice</a>.</span></label>
          <button className="submit-request" disabled={status === 'sending' || status === 'sent'}>{status === 'sending' ? <><LoaderCircle className="spin" size={17} /> Saving request</> : status === 'sent' ? <><Check size={17} /> Request received</> : <><HeartHandshake size={17} /> Send to the real care team</>}</button>
          {message && <p className={`form-status ${status}`}>{message}</p>}
          {requestType === 'employment-interest' && <small className="employment-note"><BriefcaseBusiness size={13} /> Cat Gardens is collecting future employment interest. Submission does not create an employment relationship or promise an available role.</small>}
        </form>
      </section>

      <footer className="join-footer"><span>Cat Gardens · Parekklisia, Cyprus</span><span>A project of Gardens of St. Gertrude, the legal nonprofit caring for the animals.</span><a href="/donate.html">Support real care</a></footer>
    </main>
  )
}

createRoot(document.getElementById('participate-root')!).render(<ParticipationPortal />)
