import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { setSessionCookie } from '../../utils/auth'

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(event: H3Event): string {
  return getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? event.node.req.socket?.remoteAddress
    ?? 'unknown'
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password?: string }>(event)

  const expected = process.env.DASHBOARD_PASSWORD
  if (!expected) {
    return { ok: true }
  }

  const ip = getClientIp(event)
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (entry && entry.count >= MAX_ATTEMPTS) {
    if (now < entry.resetAt) {
      const minutesLeft = Math.ceil((entry.resetAt - now) / 60_000)
      throw createError({
        statusCode: 429,
        statusMessage: `Too many attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      })
    }
    loginAttempts.delete(ip)
  }

  if (!password || !safeEqual(password, expected)) {
    const current = loginAttempts.get(ip) ?? { count: 0, resetAt: now + LOCKOUT_MS }
    loginAttempts.set(ip, { count: current.count + 1, resetAt: current.resetAt })
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  loginAttempts.delete(ip)
  setSessionCookie(event, password)
  return { ok: true }
})
