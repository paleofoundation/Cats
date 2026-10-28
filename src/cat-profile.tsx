import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CatStory from './CatStory'
import { storyFor, storyIdForPath } from './catStories'
import { useRealityFeed } from './reality'
import { registerGardenWorker } from './pwa'
import { initializeNative, openGardenLink } from './native'

function ProfilePage() {
  const cat = storyFor(storyIdForPath(window.location.pathname))
  const reality = useRealityFeed(cat.id)
  return <main className="cat-page-shell"><nav className="cat-page-nav" aria-label="Cat Gardens"><a href="/"><img src="/assets/cat-gardens-icon.png" alt=""/> CAT GARDENS</a><div><a href="/cats">Meet the cats</a><a href="/app">Get the app</a></div></nav><CatStory catId={cat.id} {...reality} onRefresh={reality.refresh} onDonate={(need)=>{void openGardenLink(`/donate.html?program=food&cat=${cat.id}&need=${need?.id || 'food'}&frequency=once&amount=${need?.suggestedAmount || 10}`)}}/></main>
}

initializeNative().finally(()=>createRoot(document.getElementById('root')!).render(<StrictMode><ProfilePage/></StrictMode>))
registerGardenWorker()
