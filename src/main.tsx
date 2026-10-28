import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GardenAccountProvider } from './account'
import './styles.css'
import './graphics.css'
import { registerGardenWorker } from './pwa'
import { initializeNative } from './native'
import { useGame } from './game/store'

initializeNative().then(() => useGame.persist.rehydrate()).finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardenAccountProvider>
      <App />
    </GardenAccountProvider>
  </StrictMode>,
))

registerGardenWorker()
