const test = require('node:test')
const assert = require('node:assert/strict')
const { authorizedBridge, publicCareUpdate } = require('../api/_care-bridge')
const update = {source:'catgardens-care',id:'be1e3874-10bb-4aab-9e97-ea99ff70f507',version:1,state:'published',catId:'splotch',title:'A vet visit',detail:'Splotch’s care team is following the vet’s plan.',occurredAt:'2026-01-01T10:00:00Z'}
test('service auth fails closed for missing, short, altered or malformed secrets',()=>{
  const secret='a'.repeat(64)
  assert.equal(authorizedBridge('Bearer '+secret,secret),true)
  for(const header of [undefined,'', 'Bearer '+secret+'x','Bearer '+'b'.repeat(64)]) assert.equal(authorizedBridge(header,secret),false)
  assert.equal(authorizedBridge('Bearer short','short'),false)
})
test('private record fields are rejected instead of forwarded',()=>{
  for(const key of ['notes','amountCents','provider','person','files','medications','email']) assert.throws(()=>publicCareUpdate({...update,[key]:'private'}))
  assert.deepEqual(publicCareUpdate(update),{...update,occurredAt:'2026-01-01T10:00:00.000Z'})
})
test('drafts, invalid identities, oversized text and future events cannot enter public feed',()=>{
  for(const patch of [{state:'draft'},{source:'demo'},{id:'splotch'},{version:0},{version:1.5},{catId:'/api/files/private'},{detail:'a'.repeat(1601)},{occurredAt:'2099-01-01'}]) assert.throws(()=>publicCareUpdate({...update,...patch}))
  assert.equal(publicCareUpdate({...update,state:'withdrawn',version:2}).state,'withdrawn')
})
test('ingestion requires authentication before touching the database',async()=>{
  const handler=require('../api/care-ingest');const old=process.env.CARE_BRIDGE_SECRET;process.env.CARE_BRIDGE_SECRET='a'.repeat(64)
  const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}}
  await handler({method:'POST',headers:{},body:update},res);assert.equal(res.code,401)
  if(old===undefined)delete process.env.CARE_BRIDGE_SECRET;else process.env.CARE_BRIDGE_SECRET=old
})
