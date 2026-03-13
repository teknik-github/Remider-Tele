import { consumeMagicToken } from '../utils/magicLinks'
import { setSessionCookie } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event) as { token?: string }
  const password = process.env.DASHBOARD_PASSWORD

  if (!password) {
    // No auth configured — go straight to dashboard
    return sendRedirect(event, '/', 302)
  }

  if (!token || !consumeMagicToken(token)) {
    return sendRedirect(event, '/login?error=expired', 302)
  }

  // Set the session cookie in this 200 document response.
  // The cookie travels with the main page load — proxies that strip Set-Cookie
  // from redirects or AJAX responses leave document responses untouched.
  setSessionCookie(event, password)

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in…</title>' +
    '<script>window.location.replace(\'/\');<\/script>' +
    '<meta http-equiv="refresh" content="0;url=/"></head><body></body></html>'
  )
})
