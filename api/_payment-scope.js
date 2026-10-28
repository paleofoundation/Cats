const APPLICATION = 'catgardens'

function isCatGardensDonation(object) {
  return object?.metadata?.application === APPLICATION
}

function stripeLiveMode() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (/^(sk|rk)_live_/.test(key)) return true
  if (/^(sk|rk)_test_/.test(key)) return false
  throw new Error('Unrecognized Stripe key mode')
}

module.exports = { APPLICATION, isCatGardensDonation, stripeLiveMode }
