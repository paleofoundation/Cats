import { createRoot } from 'react-dom/client'
import { InstallContent } from './InstallPanel'
import { registerGardenWorker } from './pwa'
import { initializeNative } from './native'
initializeNative().finally(()=>createRoot(document.getElementById('root')!).render(<main><a className="install-home-link" href="/">← Cat Gardens</a><InstallContent/></main>))
registerGardenWorker()
