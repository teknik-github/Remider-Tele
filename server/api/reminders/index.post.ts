import { getDb } from '../../db/index'
import { reminders } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  for (const field of ['title', 'message', 'scheduledAt']) {
    if (!body[field]) {
      throw createError({ statusCode: 400, statusMessage: `Missing required field: ${field}` })
    }
  }

  const config = useRuntimeConfig()
  const chatId = body.chatId || config.telegramDefaultChatId
  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: 'chatId is required (or set TELEGRAM_DEFAULT_CHAT_ID)' })
  }

  const db = getDb()
  const result = await db
    .insert(reminders)
    .values({
      title: String(body.title).trim(),
      message: String(body.message).trim(),
      chatId,
      scheduledAt: new Date(body.scheduledAt).toISOString(),
      recurrence: body.recurrence || 'once',
      status: 'pending',
      notes: body.notes ? String(body.notes).trim() : null,
    })
    .returning()

  return result[0]
})
