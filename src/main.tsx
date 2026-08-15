import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GardenAccountProvider } from './account'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardenAccountProvider>
      <App />
    </GardenAccountProvider>
  </StrictMode>,
)
