const { authenticateGardenRequest } = require('./_auth')
const { database, ensureSchema } = require('./_db')

function configuredCaretakers() {
  return new Set(
    String(process.env.CAT_GARDENS_ADMIN_USER_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

async function authenticateCaretaker(req) {
  const account = await authenticateGardenRequest(req)
  await ensureSchema()
  const sql = database()
  const roleRows = await sql`
    SELECT role FROM garden_caretaker_roles
    WHERE user_id = ${account.userId} AND active = TRUE
    LIMIT 1
  `
  const configured = configuredCaretakers()
  if (!roleRows.length && !configured.has(account.userId)) {
    const error = new Error('This account does not have sanctuary publishing access.')
    error.statusCode = 403
    throw error
  }
  return { userId: account.userId, role: roleRows[0]?.role || 'administrator' }
}

module.exports = { authenticateCaretaker }
