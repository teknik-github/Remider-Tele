import { setSessionCookie, makeSessionToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password?: string }>(event)

  const expected = process.env.DASHBOARD_PASSWORD
  if (!expected) {
    // No password configured — auto-login
    return { ok: true }
  }

  if (!password || password !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  setSessionCookie(event, password)
  return { ok: true }
})
