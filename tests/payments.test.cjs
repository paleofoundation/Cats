const test=require('node:test')
const assert=require('node:assert/strict')
const {Readable}=require('node:stream')
test('unpaid and incomplete sessions never become verified donations',async()=>{
  const {recordDonation}=require('../api/_db')
  assert.equal(await recordDonation({status:'complete',payment_status:'unpaid'}),false)
  assert.equal(await recordDonation({status:'open',payment_status:'paid'}),false)
})
test('signed delayed payment events reach fulfillment; retries do not grant twice',async()=>{
  const stripePath=require.resolve('stripe'),dbPath=require.resolve('../api/_db'),handlerPath=require.resolve('../api/stripe-webhook')
  const oldStripe=require.cache[stripePath],oldDb=require.cache[dbPath],oldHandler=require.cache[handlerPath]
  const seenEvents=new Set(),donations=new Set();let grantCount=0
  const sql=(parts,...values)=>{const q=parts.join('?');if(q.includes('SELECT event_id'))return Promise.resolve(seenEvents.has(values[0])?[{event_id:values[0]}]:[]);if(q.includes('INSERT INTO garden_stripe_events'))seenEvents.add(values[0]);return Promise.resolve([])}
  require.cache[stripePath]={id:stripePath,filename:stripePath,loaded:true,exports:class{constructor(){this.webhooks={constructEvent:bytes=>JSON.parse(bytes.toString())}}}}
  require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{database:()=>sql,ensureSchema:async()=>{},recordDonation:async session=>{if(session.status==='complete'&&session.payment_status==='paid'&&!donations.has(session.id)){donations.add(session.id);grantCount++}}}}
  delete require.cache[handlerPath]
  const oldKey=process.env.STRIPE_SECRET_KEY,oldHook=process.env.STRIPE_WEBHOOK_SECRET;process.env.STRIPE_SECRET_KEY='test-fixture';process.env.STRIPE_WEBHOOK_SECRET='test-fixture'
  try {
    const handler=require('../api/stripe-webhook')
    async function send(id,type,status){const req=Readable.from([Buffer.from(JSON.stringify({id,type,data:{object:{id:'cs_test_fixture',status:'complete',payment_status:status}}}))]);req.method='POST';req.headers={'stripe-signature':'fixture'};const res={setHeader(){},status(c){this.code=c;return this},json(){return this},send(){return this}};await handler(req,res);assert.equal(res.code,200)}
    await send('evt_completed','checkout.session.completed','unpaid');assert.equal(grantCount,0)
    await send('evt_async','checkout.session.async_payment_succeeded','paid');assert.equal(grantCount,1)
    await send('evt_async','checkout.session.async_payment_succeeded','paid');assert.equal(grantCount,1)
    await send('evt_repeat','checkout.session.completed','paid');assert.equal(grantCount,1)
  } finally {
    for(const [path,original] of [[stripePath,oldStripe],[dbPath,oldDb],[handlerPath,oldHandler]]){if(original)require.cache[path]=original;else delete require.cache[path]}
    if(oldKey===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=oldKey
    if(oldHook===undefined)delete process.env.STRIPE_WEBHOOK_SECRET;else process.env.STRIPE_WEBHOOK_SECRET=oldHook
  }
})
