import { getDb } from '../../db/index'
import { reminders } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const db = getDb()
  const result = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1)

  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Reminder not found' })

  return result[0]
})
