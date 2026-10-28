import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GardenAccountProvider } from './account'
import './styles.css'
import './graphics.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardenAccountProvider>
      <App />
    </GardenAccountProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/service-worker.js').catch(() => undefined) })
}
