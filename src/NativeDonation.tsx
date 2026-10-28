import { ArrowRight, X } from 'lucide-react'
import type { SplotchNeed } from './data'
import { openGardenLink } from './native'
export function NativeDonation({need,onClose}:{need:SplotchNeed;onClose:()=>void}) {
  return <div className="help-backdrop" role="presentation"><aside className="help-panel" role="dialog" aria-modal="true" aria-label="Support real sanctuary care"><button className="close-button" onClick={onClose} aria-label="Close donation"><X size={20}/></button><p className="eyebrow">REAL SANCTUARY CARE</p><h2>{need.title}</h2><p>{need.detail}</p><p>Secure donations open on the Cat Gardens website. You can return to your garden afterwards.</p><button className="primary-button" onClick={()=>{void openGardenLink(`/donate.html?program=${need.program==='sanctuary'?'greatest-need':'food'}&cat=${need.catId||'splotch'}&need=${need.id}&amount=${need.suggestedAmount}&frequency=once`)}}>Open secure donation <ArrowRight size={16}/></button></aside></div>
}
