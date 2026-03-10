import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'rt_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export function makeSessionToken(password: string): string {
  return createHmac('sha256', password).update('reminder-tele-session').digest('hex')
}

export function verifySession(event: H3Event): boolean {
  const password = process.env.DASHBOARD_PASSWORD
  if (!password) return true // no password configured → open access

  const cookie = getCookie(event, SESSION_COOKIE)
  if (!cookie) return false
  return safeEqual(cookie, makeSessionToken(password))
}

export function setSessionCookie(event: H3Event, password: string) {
  setCookie(event, SESSION_COOKIE, makeSessionToken(password), {
    httpOnly: true,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
