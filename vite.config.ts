import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicRoutes: Record<string,string> = {'/Mabel':'/watch-mabel.html','/Winona':'/watch-winona.html','/Splotch':'/watch-splotch.html','/app':'/app.html'}
function rewritePublicRoutes(server: Pick<ViteDevServer,'middlewares'>) {
  server.middlewares.use((req,_res,next)=>{
    const [path,query] = (req.url || '/').split('?')
    if(publicRoutes[path]) req.url=publicRoutes[path]+(query?'?'+query:'')
    next()
  })
}

const rootDirectory = fileURLToPath(new URL('.', import.meta.url))

const legacyPages = Object.fromEntries(
  readdirSync(rootDirectory)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), resolve(rootDirectory, file)]),
)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDirectory, '')
  const clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || env.VITE_CLERK_PUBLISHABLE_KEY
    || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || ''
  return {
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey),
    },
    server: {proxy:{'/api/reality-thread':'https://catgardens.org','/api/payment-config':'https://catgardens.org'}},
    preview: {proxy:{'/api/reality-thread':'https://catgardens.org','/api/payment-config':'https://catgardens.org'}},
    plugins: [
    {name:'public-profile-routes',configureServer:rewritePublicRoutes,configurePreviewServer:rewritePublicRoutes,transformIndexHtml(){return [{tag:'script',attrs:{type:'module',src:'/src/native-shell.ts'},injectTo:'head'}]}},
    react(),
    {
      name: 'preserve-legacy-scripts',
      closeBundle() {
        const legacyScript = resolve(rootDirectory, 'cats.js')
        const outputScript = resolve(rootDirectory, 'dist/cats.js')
        if (existsSync(legacyScript)) copyFileSync(legacyScript, outputScript)
      },
    },
    ],
    build: {
      rollupOptions: {
        input: legacyPages,
      },
    },
  }
})
