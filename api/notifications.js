const { authenticateGardenRequest } = require('./_auth')
const { database, ensureSchema } = require('./_db')

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const account = await authenticateGardenRequest(req)
    await ensureSchema()
    const sql = database()

    if (req.method === 'POST') {
      const notificationId = Number(req.body?.notificationId)
      if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({ error: 'Invalid notification.' })
      }
      const allowed = await sql`
        SELECT notification_id
        FROM garden_notifications
        WHERE notification_id = ${notificationId} AND (user_id IS NULL OR user_id = ${account.userId})
        LIMIT 1
      `
      if (!allowed.length) return res.status(404).json({ error: 'Notification not found.' })
      await sql`
        INSERT INTO garden_notification_reads (notification_id, user_id)
        VALUES (${notificationId}, ${account.userId})
        ON CONFLICT (notification_id, user_id) DO UPDATE SET read_at = NOW()
      `
      return res.status(200).json({ read: true })
    }

    const notifications = await sql`
      SELECT n.notification_id, n.cat_id, n.title, n.body, n.action_url, n.created_at,
             (r.read_at IS NOT NULL) AS read
      FROM garden_notifications n
      LEFT JOIN garden_notification_reads r
        ON r.notification_id = n.notification_id AND r.user_id = ${account.userId}
      WHERE n.user_id IS NULL OR n.user_id = ${account.userId}
      ORDER BY n.created_at DESC
      LIMIT 30
    `
    return res.status(200).json({
      notifications,
      unread: notifications.filter((item) => !item.read).length,
    })
  } catch (error) {
    console.error('Garden notifications request failed', error?.message || error)
    return res.status(error?.statusCode || 500).json({ error: error?.message || 'Unable to load garden notifications.' })
  }
}
