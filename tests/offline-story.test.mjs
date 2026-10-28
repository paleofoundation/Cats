import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import vm from 'node:vm'
import {test} from 'node:test'
import {storyFor,storyIdForPath} from '../src/catStories.ts'
import {progressStorage,setProgressBackup} from '../src/game/presentation.ts'

const sw=await readFile(new URL('../public/service-worker.js',import.meta.url),'utf8')
function worker() {
 const handlers={},fetches=[]
 const cache={addAll:async()=>{},match:async path=>({cached:path})}
 const self={GARDEN_BUILD:'test',GARDEN_FILES:['/index.html','/watch-mabel.html','/watch-splotch.html','/watch-winona.html','/app.html','/assets/world.js','/fonts/garden-labels.woff'],location:{origin:'https://catgardens.org'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}}}
 vm.runInNewContext(sw,{self,URL,Response,importScripts:()=>{},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},fetch:async req=>{fetches.push(req);throw new Error('offline')}})
 const request=(path,options={})=>{
  let response
  handlers.fetch({request:{url:`https://catgardens.org${path}`,method:'GET',mode:'navigate',headers:new Headers(),...options},respondWith:value=>{response=value}})
  return response
 }
 return {request,fetches}
}

test('offline navigation preserves the requested cat page and game query',async()=>{
 const {request}=worker()
 assert.deepEqual(await request('/Mabel'),{cached:'/watch-mabel.html'})
 assert.deepEqual(await request('/?companion=mabel'),{cached:'/index.html'})
 assert.deepEqual(await request('/app'),{cached:'/app.html'})
})
test('private, payment, API and authenticated requests never enter the offline cache',()=>{
 const {request}=worker()
 for(const path of ['/api/game-profile','/api/reality-thread?cat=mabel','/api/payment-config','/staff','/caretaker','/donate.html','/donation-success.html','/?session_id=secret']) assert.equal(request(path),undefined,path)
 assert.equal(request('/',{method:'POST'}),undefined)
 assert.equal(request('/',{headers:new Headers({Authorization:'Bearer test'})}),undefined)
})
test('public game assets are available offline without intercepting unknown resources',async()=>{
 const {request}=worker()
 assert.deepEqual(await request('/assets/world.js',{mode:'cors'}),{cached:'/assets/world.js'})
 assert.equal(request('/account-private.json',{mode:'cors'}),undefined)
 assert.equal(request('/assets/world.js?import',{mode:'cors'}),undefined)
 assert.equal(request('/assets/world.js?v=new-build',{mode:'cors'}),undefined)
})
test('native save backup receives real progress changes and resets, not movement frames',()=>{
 const backups=[];let saved=''
 setProgressBackup((name,value)=>backups.push({name,value}))
 const storage=progressStorage(()=>({setItem:(_,value)=>saved=value,getItem:()=>saved,removeItem:()=>saved=''}))
 const state={selectedCompanionId:'mabel',tokens:120}
 for(let i=0;i<300;i++)storage.setItem('garden',{state,version:8})
 assert.equal(backups.length,1)
 assert.equal(JSON.parse(backups[0].value).state.selectedCompanionId,'mabel')
 storage.removeItem('garden');assert.equal(backups[1].value,null)
 setProgressBackup(()=>{})
})
test('every public cat route keeps its original films and a unique story',()=>{
 assert.equal(storyIdForPath('/Mabel'),'mabel')
 assert.equal(storyIdForPath('/watch-winona.html'),'winona-p-gray')
 assert.equal(storyFor('mabel').films.length,2)
 assert.equal(storyFor('mabel').films[0].youtubeId,'aH2YusZRidI')
 assert.equal(storyFor('splotch').films[0].video,'/videos/splotch-petting.mp4')
 assert.equal(storyFor('winona-p-gray').films[0].youtubeId,'avpx0oLfPmU')
})
