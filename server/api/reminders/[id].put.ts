import { getDb } from '../../db/index'
import { reminders } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const body = await readBody(event)
  const db = getDb()

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (body.title !== undefined)       updateData.title = String(body.title).trim()
  if (body.message !== undefined)     updateData.message = String(body.message).trim()
  if (body.chatId !== undefined)      updateData.chatId = body.chatId
  if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt).toISOString()
  if (body.recurrence !== undefined)  updateData.recurrence = body.recurrence
  if (body.status !== undefined)      updateData.status = body.status
  if (body.notes !== undefined)       updateData.notes = body.notes ? String(body.notes).trim() : null

  const updated = await db.update(reminders).set(updateData).where(eq(reminders.id, id)).returning()

  if (!updated.length) throw createError({ statusCode: 404, statusMessage: 'Reminder not found' })

  return updated[0]
})
