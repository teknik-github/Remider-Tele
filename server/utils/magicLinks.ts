import { randomBytes } from 'node:crypto'

interface MagicToken {
  token: string
  expiresAt: number
}

const tokens = new Set<MagicToken>()
const TOKEN_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function createMagicToken(): string {
  const now = Date.now()
  // Prune expired tokens
  for (const t of tokens) {
    if (t.expiresAt < now) tokens.delete(t)
  }
  const token = randomBytes(32).toString('hex')
  tokens.add({ token, expiresAt: now + TOKEN_TTL_MS })
  return token
}

export function consumeMagicToken(token: string): boolean {
  const now = Date.now()
  for (const t of tokens) {
    if (t.token === token && t.expiresAt >= now) {
      tokens.delete(t)
      return true
    }
  }
  return false
}
