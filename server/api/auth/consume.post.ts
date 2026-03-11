import { consumeMagicToken } from '../../utils/magicLinks'
import { setSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { token } = await readBody<{ token?: string }>(event)
  const password = process.env.DASHBOARD_PASSWORD
  if (!password) {
    return { ok: true } // open access — no password configured
  }
  if (!token || !consumeMagicToken(token)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired link' })
  }
  setSessionCookie(event, password)
  return { ok: true }
})
