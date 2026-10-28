const Stripe = require('stripe')
const { authorizedBridge } = require('./_care-bridge')
const { authenticateCaretaker } = require('./_caretaker')
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store')
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
  try {
    if(!authorizedBridge(req.headers.authorization,process.env.CARE_BRIDGE_SECRET)) await authenticateCaretaker(req)
  } catch(e){return res.status(e.statusCode||403).json({error:'Staff access required.'})}
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({configured:false,error:'Stripe secret key missing.'})
  try {
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:'2026-06-24.dahlia'})
    const account=await stripe.accounts.retrieve()
    const endpoints=await stripe.webhookEndpoints.list({limit:100})
    const endpoint=endpoints.data.find(e=>e.url==='https://catgardens.org/api/stripe-webhook'&&e.status==='enabled')
    const required=['checkout.session.completed','checkout.session.async_payment_succeeded','invoice.paid']
    const missingEvents=required.filter(e=>!endpoint?.enabled_events.includes(e)&&!endpoint?.enabled_events.includes('*'))
    const publishable=process.env.STRIPE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY||''
    const testMode=process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')||process.env.STRIPE_SECRET_KEY.startsWith('rk_test_')
    const keyModesMatch=publishable.startsWith(testMode?'pk_test_':'pk_live_')
    return res.status(200).json({configured:true,accountId:account.id,businessName:account.business_profile?.name||account.settings?.dashboard?.display_name||'Stripe account',
      chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,testMode,keyModesMatch,
      webhookConfigured:!!endpoint&&!!process.env.STRIPE_WEBHOOK_SECRET,missingEvents,
      ready:!!account.charges_enabled&&keyModesMatch&&!!endpoint&&!!process.env.STRIPE_WEBHOOK_SECRET&&!missingEvents.length,
      note:'Readiness checks configuration only. Complete a sandbox payment and verify its signed webhook before declaring end-to-end payments tested.'})
  }catch(e){return res.status(503).json({configured:true,error:'Stripe account or webhook inspection failed. Check the configured key permissions.'})}
}
