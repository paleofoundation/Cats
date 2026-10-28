import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GardenAccountProvider } from './account'
import './styles.css'
import './graphics.css'
import { registerGardenWorker } from './pwa'
import { initializeNative } from './native'
import { useGame } from './game/store'

const CharacterStudio = import.meta.env.DEV ? lazy(() => import('./CharacterStudio')) : null

initializeNative().then(() => useGame.persist.rehydrate()).finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardenAccountProvider>
      {CharacterStudio && location.pathname === '/art-preview' ? <Suspense fallback={null}><CharacterStudio /></Suspense> : <App />}
    </GardenAccountProvider>
  </StrictMode>,
))

registerGardenWorker()
