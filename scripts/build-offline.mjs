import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
const root = new URL('../dist/',import.meta.url)
async function files(directory='') {
 const entries=await readdir(new URL(directory,root),{withFileTypes:true})
 return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(`${directory}${entry.name}/`):`${directory}${entry.name}`))).flat()
}
const pages=new Set(['index.html','watch-mabel.html','watch-splotch.html','watch-winona.html','app.html'])
const assets=(await files()).filter(file=>pages.has(file)||/^(assets|models|fonts)\//.test(file)&&/\.(js|css|glb|wasm|png|jpe?g|webp|svg|woff2?|ttf)$/.test(file)).sort()
const hash=createHash('sha256')
for(const asset of assets) hash.update(await readFile(new URL(asset,root)))
const version=hash.digest('hex').slice(0,16)
await writeFile(new URL('precache.js',root),`self.GARDEN_BUILD=${JSON.stringify(version)};\nself.GARDEN_FILES=${JSON.stringify(assets.map(file=>'/'+file))};\n`)
console.log(`Offline garden: ${assets.length} public files, build ${version}`)
