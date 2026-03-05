import { getDb } from '../../db/index'
import { reminders } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const db = getDb()
  const deleted = await db.delete(reminders).where(eq(reminders.id, id)).returning()

  if (!deleted.length) throw createError({ statusCode: 404, statusMessage: 'Reminder not found' })

  return { success: true, deleted: deleted[0] }
})
