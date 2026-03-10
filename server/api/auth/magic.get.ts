import { consumeMagicToken } from '../../utils/magicLinks'
import { setSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = String(getQuery(event).token || '')

  const password = process.env.DASHBOARD_PASSWORD
  if (!password) {
    // Auth not configured — just redirect to dashboard
    return sendRedirect(event, '/')
  }

  if (!token || !consumeMagicToken(token)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired link' })
  }

  setSessionCookie(event, password)
  return sendRedirect(event, '/')
})
