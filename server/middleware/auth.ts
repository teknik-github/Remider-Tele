import { verifySession } from '../utils/auth'

export default defineEventHandler((event) => {
  const url = event.node.req.url || ''

  // Only protect reminder API routes
  if (!url.startsWith('/api/reminders')) return

  if (!verifySession(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
