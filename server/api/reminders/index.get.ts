import { getDb } from '../../db/index'
import { reminders } from '../../db/schema'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const query = getQuery(event)
  const statusFilter = query.status as string | undefined

  if (statusFilter && ['pending', 'sent', 'cancelled'].includes(statusFilter)) {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.status, statusFilter as 'pending' | 'sent' | 'cancelled'))
      .orderBy(desc(reminders.scheduledAt))
  }

  return await db.select().from(reminders).orderBy(desc(reminders.scheduledAt))
})
