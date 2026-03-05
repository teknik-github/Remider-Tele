import { verifySession } from '../../utils/auth'

export default defineEventHandler((event) => {
  return { ok: verifySession(event) }
})
