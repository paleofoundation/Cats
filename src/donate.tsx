import { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { ArrowLeft, Check, ChevronRight, Clock3, HeartHandshake, Landmark, Repeat2, Shield, Sparkles, Users, WalletCards } from 'lucide-react'
import catGardensIcon from '../assets/cat-gardens-icon.png'
import donationHero from '../assets/hero_donate_v2.jpg'
import './donate.css'

type Frequency = 'once' | 'monthly'

type GivingProgram = {
  id: string
  name: string
  eyebrow: string
  description: string
  needId: string
  badge: string
  catId: string
  program: 'cat-care' | 'cat-gardens-tv' | 'sanctuary'
  suggested: number
}

const givingPrograms: GivingProgram[] = [
  {
    id: 'greatest-need',
    name: 'Where it is needed most',
    eyebrow: 'SANCTUARY-WIDE',
    description: 'Food, water, cleaning, bedding, transport, routine observation, and urgent reviewed needs across the sanctuary.',
    needId: 'general-care', badge: 'garden-keeper', catId: 'cat-gardens', program: 'sanctuary', suggested: 40,
  },
  {
    id: 'food',
    name: 'Food and daily supplies',
    eyebrow: 'EVERY DAY',
    description: 'Recurring food, water, supplements, cleaning supplies, and practical materials for more than ninety cats.',
    needId: 'food', badge: 'bowl-bringer', catId: 'splotch', program: 'cat-care', suggested: 40,
  },
  {
    id: 'medical',
    name: 'Veterinary and medical care',
    eyebrow: 'HEALTH',
    description: 'Reviewed veterinary visits, diagnostics, medication, supportive care, transport, and medical supplies for real cats.',
    needId: 'medical-care', badge: 'bright-bite', catId: 'cat-gardens', program: 'sanctuary', suggested: 100,
  },
  {
    id: 'care-team',
    name: 'The human care team',
    eyebrow: 'HUMAN INFRASTRUCTURE',
    description: 'Help sustain the people who feed, clean, observe, transport, brush, medicate, document, and spend patient time with the cats.',
    needId: 'care-team', badge: 'gentle-hands', catId: 'cat-gardens', program: 'sanctuary', suggested: 100,
  },
  {
    id: 'safe-future',
    name: 'A safer long-term home',
    eyebrow: 'THE DREAM',
    description: 'Support the reviewed sanctuary and land program behind protected gardens away from immediate road danger.',
    needId: 'mathikoloni', badge: 'dream-builder', catId: 'splotch', program: 'sanctuary', suggested: 250,
  },
]

const amountOptions: Record<Frequency, number[]> = { monthly: [10, 20, 40, 100], once: [25, 50, 100, 250] }

function initialSelection() {
  const params = new URLSearchParams(window.location.search)
  const frequency: Frequency = params.get('frequency') === 'once' ? 'once' : 'monthly'
  const requestedAmount = Number(params.get('amount'))
  const programId = params.get('program') || params.get('campaign') || 'greatest-need'
  const program = programId === 'full-month' ? fullMonthProgram() : givingPrograms.find((item) => item.id === programId || item.needId === programId) || givingPrograms[0]
  const amount = Number.isFinite(requestedAmount) && requestedAmount >= 5 ? Math.min(500000, requestedAmount) : program.suggested
  return { frequency, amount, program }
}

function fullMonthProgram(): GivingProgram {
  return {
    id: 'full-month', name: 'One historical operating month', eyebrow: 'FULL-MONTH COMMITMENT',
    description: 'A $12,000 historical operating snapshot from the original sanctuary website. Current costs are being reconciled and allocations will be published through the real care record.',
    needId: 'full-month', badge: 'garden-keeper', catId: 'cat-gardens', program: 'sanctuary', suggested: 12000,
  }
}

function GivingPortal() {
  const initial = useMemo(initialSelection, [])
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency)
  const [amount, setAmount] = useState(initial.amount)
  const [selectedProgram, setSelectedProgram] = useState(initial.program)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/payment-config')
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.publishableKey) throw new Error(payload.error || 'Secure checkout is not configured.')
        if (active) setStripePromise(loadStripe(payload.publishableKey))
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Secure checkout is temporarily unavailable.') })
    return () => { active = false }
  }, [])

  const isFullMonth = selectedProgram.id === 'full-month'
  const monthlyAlternative = Math.max(10, Math.round((amount * 0.6) / 5) * 5)

  const selectFrequency = (next: Frequency) => {
    setFrequency(next)
    setCheckoutOpen(false)
    if (!customAmount) setAmount(next === 'monthly' ? 40 : 50)
  }

  const selectProgram = (program: GivingProgram) => {
    setSelectedProgram(program)
    setCheckoutOpen(false)
    if (!customAmount) setAmount(program.suggested)
  }

  const selectFullMonth = () => {
    setSelectedProgram(fullMonthProgram())
    setFrequency('once')
    setAmount(12000)
    setCustomAmount(false)
    setCheckoutOpen(false)
    document.getElementById('giving-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fetchClientSecret = useCallback(async () => {
    const response = await fetch('/api/create-embedded-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, frequency, needId: selectedProgram.needId, needTitle: selectedProgram.name,
        badge: selectedProgram.badge, catId: selectedProgram.catId, program: selectedProgram.program, returnTo: 'donate',
      }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.clientSecret) throw new Error(payload.error || 'Unable to open secure checkout.')
    return payload.clientSecret as string
  }, [amount, frequency, selectedProgram])

  return (
    <main className="give-page">
      <nav className="give-nav" aria-label="Cat Gardens">
        <a className="give-brand" href="/"><img src={catGardensIcon} alt="" />Cat Gardens</a>
        <div><a href="/cats">Meet the cats</a><a href="/volunteer.html">Help in person</a><a className="nav-play" href="/"><ArrowLeft size={14} /> Return to the game</a></div>
      </nav>

      <section className="give-hero">
        <div className="give-hero-copy">
          <p className="give-eyebrow">REAL CATS · REAL WORK · CYPRUS</p>
          <h1>Keep the garden alive.</h1>
          <p>More than ninety cats depend on daily food, medicine, clean spaces, safe shelter, transport, observation, and human attention. Your donation goes to Gardens of St. Gertrude, the legal nonprofit doing that work.</p>
          <div className="hero-actions"><button onClick={() => document.getElementById('giving-panel')?.scrollIntoView({ behavior: 'smooth' })}>Choose a gift <ChevronRight size={16} /></button><button className="hero-secondary" onClick={selectFullMonth}>Fund a full month · $12,000</button></div>
          <div className="hero-trust"><Shield size={17} /><span>Secure Stripe Checkout. Card details never pass through Cat Gardens.</span></div>
        </div>
        <figure className="give-hero-visual"><img src={donationHero} alt="A real cat living at Cat Gardens in Cyprus" /><figcaption><span>THE REAL GARDEN</span><strong>Play creates a relationship. Giving sustains the work.</strong></figcaption></figure>
      </section>

      <section className="giving-layout" id="giving-panel">
        <div className="giving-story">
          <p className="give-eyebrow">CHOOSE THE REAL-WORLD PRIORITY</p>
          <h2>Every gift enters the care record.</h2>
          <p>Choose an area or let the sanctuary direct your gift to the greatest reviewed need. If a selected need is already covered, the final allocation can appear in the Live Record.</p>
          <div className="program-list" role="list">
            {givingPrograms.map((program) => <button className={selectedProgram.id === program.id ? 'selected' : ''} onClick={() => selectProgram(program)} key={program.id} role="listitem"><span>{selectedProgram.id === program.id ? <Check size={15} /> : <HeartHandshake size={15} />}</span><div><small>{program.eyebrow}</small><strong>{program.name}</strong><p>{program.description}</p></div></button>)}
          </div>
          <button className={`month-card ${isFullMonth ? 'selected' : ''}`} onClick={selectFullMonth}><Landmark size={25} /><div><small>HISTORICAL OPERATING SNAPSHOT</small><strong>Fund one entire month · $12,000</strong><p>The original site recorded approximately $12,000 as a month of sanctuary costs. It remains a giving option while current accounting is reconciled; it is not presented as a live audited total.</p></div><ChevronRight size={18} /></button>
        </div>

        <aside className="giving-card">
          {!checkoutOpen ? <>
            <header><span>{selectedProgram.eyebrow}</span><h2>{selectedProgram.name}</h2><p>{selectedProgram.description}</p></header>
            <div className="frequency-switch" aria-label="Donation frequency"><button className={frequency === 'once' ? 'active' : ''} onClick={() => selectFrequency('once')}>Give once</button><button className={frequency === 'monthly' ? 'active' : ''} onClick={() => selectFrequency('monthly')}><Repeat2 size={14} /> Give monthly</button></div>
            <label className="amount-label"><span>Donation amount · USD</span><div><b>$</b><input aria-label="Donation amount in US dollars" min="5" max="500000" type="number" value={amount} onChange={(event) => { setAmount(Math.max(5, Math.min(500000, Number(event.target.value)))); setCustomAmount(true); setCheckoutOpen(false) }} /></div></label>
            <div className="amount-grid">{amountOptions[frequency].map((value) => <button className={amount === value ? 'active' : ''} key={value} onClick={() => { setAmount(value); setCustomAmount(false); setCheckoutOpen(false) }}>${value.toLocaleString()}</button>)}<button className={customAmount ? 'active' : ''} onClick={() => { setCustomAmount(true); setCheckoutOpen(false) }}>Other</button></div>
            {frequency === 'once' && !isFullMonth && amount >= 25 && <div className="monthly-nudge"><Clock3 size={21} /><div><small>A STEADIER OPTION</small><strong>${monthlyAlternative}/month may help the team plan further ahead.</strong><p>You keep complete control. This changes the frequency and lowers today’s amount.</p></div><button onClick={() => { setFrequency('monthly'); setAmount(monthlyAlternative); setCustomAmount(false) }}>Choose monthly</button></div>}
            <div className="allocation-note"><Sparkles size={18} /><p><strong>What happens next:</strong> Stripe confirms the gift. The sanctuary reviews where it is used. Allocation and proof remain distinct so an incoming donation is never mistaken for completed care.</p></div>
            <button className="checkout-button" disabled={!stripePromise || Boolean(error) || amount < 5} onClick={() => setCheckoutOpen(true)}><WalletCards size={18} /> Continue to secure {frequency === 'monthly' ? 'monthly ' : ''}donation</button>
            {error && <p className="give-error">{error}</p>}<small className="wallet-note">Eligible devices may show Apple Pay or other secure payment methods selected dynamically by Stripe.</small>
          </> : <div className="checkout-stage"><button className="edit-gift" onClick={() => setCheckoutOpen(false)}><ArrowLeft size={14} /> Edit gift</button><div className="checkout-summary"><span>{frequency === 'monthly' ? 'MONTHLY' : 'ONE TIME'}</span><strong>${amount.toLocaleString()} USD</strong><small>{selectedProgram.name}</small></div>{stripePromise && <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>}</div>}
          <footer><Shield size={15} /><span>Verified gifts support Gardens of St. Gertrude and grant Garden Tokens in Cat Gardens. Tokens are a game reward with no cash value.</span></footer>
        </aside>
      </section>

      <section className="people-strip"><div><Users size={28} /><p className="give-eyebrow">CARE IS HUMAN WORK</p><h2>Money helps. People do too.</h2><p>Volunteer in Cyprus, offer skilled remote help, express interest in future paid care work, or help fund the human team that makes every feeding, cleaning, vet trip, brushing session, and real-life update possible.</p></div><a href="/volunteer.html">Open the participation portal <ChevronRight size={17} /></a></section>
      <footer className="give-footer"><span>Cat Gardens · Parekklisia, Cyprus</span><span>Gardens of St. Gertrude is the legal nonprofit receiving donations.</span><a href="/privacy.html">Privacy</a></footer>
    </main>
  )
}

createRoot(document.getElementById('donate-root')!).render(<GivingPortal />)
