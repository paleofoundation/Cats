const { verifyToken } = require('@clerk/backend')

function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || (host?.includes('localhost') ? 'http' : 'https')
  return host && /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host) ? `${protocol}://${host}` : null
}

async function authenticateGardenRequest(req, { optional = false } = {}) {
  if (!process.env.CLERK_SECRET_KEY) {
    if (optional) return null
    const error = new Error('Account service is not configured.')
    error.statusCode = 503
    throw error
  }

  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    if (optional) return null
    const error = new Error('Sign in is required.')
    error.statusCode = 401
    throw error
  }

  try {
    const origin = requestOrigin(req)
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      ...(origin ? { authorizedParties: [origin] } : {}),
    })
    return { userId: payload.sub }
  } catch (cause) {
    if (optional) return null
    const error = new Error('Your sign-in could not be verified.')
    error.statusCode = 401
    error.cause = cause
    throw error
  }
}

module.exports = { authenticateGardenRequest }
