import { timingSafeEqual } from 'node:crypto'
import { createMagicToken } from '../utils/magicLinks'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'API key not configured' })
  }

  const provided = getRequestHeader(event, 'x-api-key') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(apiKey)
  const valid = a.length === b.length && timingSafeEqual(a, b)

  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid API key' })
  }

  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '')
  if (!appUrl) {
    throw createError({ statusCode: 503, statusMessage: 'APP_URL not configured' })
  }

  const token = createMagicToken()
  return { url: `${appUrl}/magic?token=${token}` }
})
