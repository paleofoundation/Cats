import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = fileURLToPath(new URL('.', import.meta.url))

const legacyPages = Object.fromEntries(
  readdirSync(rootDirectory)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), resolve(rootDirectory, file)]),
)

export default defineConfig({
  plugins: [
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
})
