/** Only public, built assets are cached. APIs, accounts and payments stay online. */
export function registerGardenWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !['https:','http:'].includes(location.protocol)) return
  const register = () => navigator.serviceWorker.register('/service-worker.js', {updateViaCache:'none'}).catch(()=>undefined)
  if (document.readyState === 'complete') void register()
  else window.addEventListener('load', register, {once:true})
}
