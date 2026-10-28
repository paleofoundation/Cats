import { Capacitor } from '@capacitor/core'
import { setProgressBackup } from './game/presentation'

const SAVE_KEY = 'cat-gardens-splotch-relationship-v4'
export const isNativeGarden = () => Capacitor.isNativePlatform()
const routes: Record<string,string> = {'/':'/index.html','/Mabel':'/watch-mabel.html','/Splotch':'/watch-splotch.html','/Winona':'/watch-winona.html','/app':'/app.html','/cats':'/cats.html','/Chanda':'/chanda.html','/sanctuary':'/sanctuary.html'}

let nativeReady: Promise<void> | undefined
export function initializeNative() {
  return nativeReady ||= startNative()
}
async function startNative() {
  if (!isNativeGarden()) return
  const [{App},{Browser},{Preferences}] = await Promise.all([import('@capacitor/app'),import('@capacitor/browser'),import('@capacitor/preferences')])
  document.documentElement.classList.add('native-garden')
  const stored = await Preferences.get({key:SAVE_KEY})
  if (stored.value && !localStorage.getItem(SAVE_KEY)) {
    try { JSON.parse(stored.value); localStorage.setItem(SAVE_KEY,stored.value) } catch { /* Keep a fresh garden usable if a backup is damaged. */ }
  }
  let saveQueue = Promise.resolve()
  setProgressBackup((name,value)=>{ if(name===SAVE_KEY) saveQueue=saveQueue.catch(()=>undefined).then(()=>value===null?Preferences.remove({key:name}):Preferences.set({key:name,value})).catch(()=>undefined) })
  // The native package owns its game assets; requests still use the existing authenticated backend.
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input,init) => {
    if(typeof input==='string' && input.startsWith('/api/')) return originalFetch(`https://catgardens.org${input}`,init)
    return originalFetch(input,init)
  }
  document.addEventListener('click',event=>{
    const anchor=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[href]')
    if(!anchor || event.defaultPrevented || anchor.hasAttribute('download'))return
    const url=new URL(anchor.href,location.href)
    if(!['http:','https:','capacitor:'].includes(url.protocol))return
    if(url.hash && url.pathname===location.pathname && url.origin===location.origin)return
    const local=url.origin===location.origin || url.origin==='https://catgardens.org'
    if(local && routes[url.pathname]) {
      event.preventDefault(); location.href=routes[url.pathname]+url.search+url.hash
    } else if(!local || /^(\/donate|\/staff|\/caretaker|\/donation-)/.test(url.pathname)) {
      event.preventDefault(); void Browser.open({url:local?`https://catgardens.org${url.pathname}${url.search}${url.hash}`:url.href})
    }
  })
  await App.addListener('appStateChange',({isActive})=>{
    window.dispatchEvent(new Event(isActive?'focus':'blur'))
    window.dispatchEvent(new CustomEvent('garden-app-active',{detail:isActive}))
    if(!isActive) document.querySelectorAll('video').forEach(video=>video.pause())
  })
  await App.addListener('appUrlOpen',({url:raw})=>{
    const url=new URL(raw)
    if(url.protocol==='catgardens:' && routes[url.pathname]) location.href=routes[url.pathname]+url.search
  })
}

export async function shareGardenStory(title:string,url:string) {
  if(isNativeGarden()) { const {Share}=await import('@capacitor/share'); await Share.share({title,url}); return }
  if(navigator.share) await navigator.share({title,url})
  else await navigator.clipboard.writeText(url)
}

export async function gardenHaptic() {
  if(!isNativeGarden())return
  const {Haptics,ImpactStyle}=await import('@capacitor/haptics')
  await Haptics.impact({style:ImpactStyle.Light}).catch(()=>undefined)
}

export async function openGardenLink(path: string) {
  if(isNativeGarden()) { const {Browser}=await import('@capacitor/browser'); await Browser.open({url:new URL(path,'https://catgardens.org').href}) }
  else location.href=path
}
