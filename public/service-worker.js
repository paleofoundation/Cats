/* Network-first: never cache private records, authentication, APIs, or payment pages. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || url.pathname !== '/' || url.searchParams.has('session_id')) return
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cat Gardens</title><body style="font-family:system-ui;background:#f3efe6;color:#29332e;padding:32px"><h1>Your garden needs a connection.</h1><p>Connect to the internet to open the game, see current care updates, or donate.</p><button onclick="location.reload()" style="font-size:18px;padding:12px">Try again</button></body></html>',
    {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}))))
})
