import { useEffect, useState } from 'react'
import { ArrowRight, Check, Download, Share2, Smartphone, X } from 'lucide-react'
import './install.css'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{outcome: string}> }
let pendingPrompt: InstallPrompt | null = null
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); pendingPrompt = event as InstallPrompt; window.dispatchEvent(new Event('garden-install-ready')) })

export function InstallContent() {
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & {standalone?:boolean}).standalone))
  const [canInstall, setCanInstall] = useState(Boolean(pendingPrompt))
  const [platform, setPlatform] = useState<'iphone'|'android'|'desktop'>(() => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iphone' : /Android/.test(navigator.userAgent) ? 'android' : 'iphone')
  useEffect(() => {
    const ready = () => setCanInstall(Boolean(pendingPrompt))
    const done = () => { setInstalled(true); pendingPrompt = null; setCanInstall(false) }
    window.addEventListener('garden-install-ready', ready); window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('garden-install-ready', ready); window.removeEventListener('appinstalled', done) }
  }, [])
  const install = async () => {
    if (!pendingPrompt) return
    const prompt = pendingPrompt
    await prompt.prompt(); const choice = await prompt.userChoice
    pendingPrompt = null; setCanInstall(false)
    if(choice.outcome === 'accepted') setInstalled(true)
  }
  return <div className="install-content">
    <img className="install-icon" src="/assets/cat-gardens-icon.png" alt="Cat Gardens app icon"/>
    <p className="install-eyebrow">A LITTLE GARDEN. ALWAYS CLOSE.</p>
    <h1 id="install-title">Your cats.<br/>On your Home Screen.</h1>
    <p>Create your own caretaker, build a garden, and get to know the real cats behind the game. Free to play.</p>
    {installed ? <div className="install-success"><Check/> You’re already playing in the app.</div> : <>
      <div className="install-platforms" aria-label="Choose your device">{(['iphone','android','desktop'] as const).map(value=><button key={value} aria-pressed={platform===value} onClick={()=>setPlatform(value)}>{value==='iphone' ? 'iPhone & iPad' : value==='android' ? 'Android' : 'Computer'}</button>)}</div>
      {canInstall && <button className="install-action" onClick={install}><Download size={18}/> Install Cat Gardens</button>}
      <ol className="install-steps">
        {platform==='iphone' ? <><li><b>1</b><span>Open <strong>catgardens.org/app</strong> in Safari.</span></li><li><b>2</b><span>Tap <Share2 size={15}/> <strong>Share</strong> in the browser menu, then <strong>Add to Home Screen</strong>.</span></li><li><b>3</b><span>Leave <strong>Open as Web App</strong> on if shown, then tap <strong>Add</strong>.</span></li></> : <><li><b>1</b><span>Open this site in Chrome or Edge.</span></li><li><b>2</b><span>Choose <strong>Install Cat Gardens</strong> above, or use <strong>Install app</strong> / <strong>Add to Home Screen</strong> in your browser menu.</span></li><li><b>3</b><span>Open the Cat Gardens icon to return to your garden.</span></li></>}
      </ol>
    </>}
    <div className="install-features"><span><Smartphone size={18}/> Full-screen play</span><span><Check size={18}/> Your own avatar</span><span><Check size={18}/> Saved garden</span></div>
    <p className="install-note">Open the garden once while online to prepare offline play. Real care updates, videos, sign-in, syncing, and donations need a connection. Sign in to carry progress between devices; guest progress stays in this browser or installed app.</p>
    <a className="install-action" href="/">Open my garden <ArrowRight size={18}/></a>
  </div>
}

export function InstallPanel({onClose}:{onClose:()=>void}) {
  useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[onClose])
  return <div className="help-backdrop install-backdrop" role="presentation"><aside className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title"><button className="close-button" onClick={onClose} aria-label="Close Home Screen instructions"><X size={20}/></button><InstallContent/></aside></div>
}
