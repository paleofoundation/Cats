/* The generated list contains public build output only, never an API response. */
importScripts('/precache.js')
const CACHE = `cat-gardens-public-${self.GARDEN_BUILD}`
const PUBLIC_FILES = new Set(self.GARDEN_FILES)
const PUBLIC_ROUTES = new Map([['/','/index.html'],['/Mabel','/watch-mabel.html'],['/Splotch','/watch-splotch.html'],['/Winona','/watch-winona.html'],['/app','/app.html']])
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(self.GARDEN_FILES)))
  // Updates wait for every open garden to close; never replace a running game.
})
self.addEventListener('activate', event => event.waitUntil((async()=>{
  const keys = await caches.keys()
  await Promise.all(keys.filter(key=>key.startsWith('cat-gardens-public-') && key!==CACHE).map(key=>caches.delete(key)))
  await self.clients.claim()
})()))
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return
  const url = new URL(event.request.url)
  if(url.origin!==self.location.origin || url.pathname.startsWith('/api/') || url.searchParams.has('session_id') || event.request.headers.has('Authorization')) return
  const page = PUBLIC_ROUTES.get(url.pathname) || (['/index.html','/watch-mabel.html','/watch-splotch.html','/watch-winona.html','/app.html'].includes(url.pathname) ? url.pathname : null)
  if(event.request.mode==='navigate' && page) {
    event.respondWith(fetch(event.request).catch(async()=>{
      const cache = await caches.open(CACHE)
      return await cache.match(page) || new Response('Connect to the internet and reopen Cat Gardens to prepare this page for offline play.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})
    }))
  } else if(PUBLIC_FILES.has(url.pathname) && !url.pathname.endsWith('.html')) {
    event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(url.pathname) || fetch(event.request)))
  }
})
