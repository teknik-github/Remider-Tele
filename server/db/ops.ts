import { eq, and, lte, desc } from 'drizzle-orm'
import { getDb, getDbType } from './index'
import * as sqliteSchema from './schema.sqlite'
import * as mysqlSchema from './schema.mysql'
import type { Reminder, NewReminder, ReminderStatus } from './schema'
import { reminderBus } from '../utils/reminderBus'

function getTable() {
  return getDbType() === 'sqlite' ? sqliteSchema.reminders : mysqlSchema.reminders
}

export async function listReminders(statusFilter?: string): Promise<Reminder[]> {
  const db = await getDb()
  const t = getTable()

  if (statusFilter && ['pending', 'sent', 'cancelled'].includes(statusFilter)) {
    return (await db
      .select()
      .from(t)
      .where(eq(t.status, statusFilter as ReminderStatus))
      .orderBy(desc(t.scheduledAt))) as Reminder[]
  }

  return (await db.select().from(t).orderBy(desc(t.scheduledAt))) as Reminder[]
}

export async function getReminder(id: number): Promise<Reminder | null> {
  const db = await getDb()
  const t = getTable()
  const result = await db.select().from(t).where(eq(t.id, id)).limit(1)
  return (result[0] as Reminder) ?? null
}

export async function createReminder(data: NewReminder): Promise<Reminder> {
  const db = await getDb()
  const t = getTable()
  const type = getDbType()
  const now = new Date().toISOString()

  const insertData = {
    title: data.title,
    message: data.message,
    chatId: data.chatId,
    scheduledAt: data.scheduledAt,
    recurrence: data.recurrence ?? 'once',
    status: data.status ?? 'pending',
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }

  let result: Reminder
  if (type === 'sqlite') {
    const [row] = await db.insert(t).values(insertData).returning()
    result = row as Reminder
  }
  else {
    // MySQL/MariaDB: no RETURNING — use insertId then SELECT
    const res = await db.insert(t).values(insertData)
    const insertId = (res as unknown as [{ insertId: number }])[0]?.insertId
    result = (await getReminder(insertId))!
  }
  reminderBus.emit('change')
  return result
}

export async function updateReminder(id: number, data: Record<string, unknown>): Promise<Reminder | null> {
  const db = await getDb()
  const t = getTable()
  const type = getDbType()

  let result: Reminder | null
  if (type === 'sqlite') {
    const [row] = await db.update(t).set(data).where(eq(t.id, id)).returning()
    result = (row as Reminder) ?? null
  }
  else {
    const res = await db.update(t).set(data).where(eq(t.id, id))
    const affected = (res as unknown as [{ affectedRows: number }])[0]?.affectedRows
    if (!affected) return null
    result = await getReminder(id)
  }
  if (result) reminderBus.emit('change')
  return result
}

export async function deleteReminder(id: number): Promise<Reminder | null> {
  const db = await getDb()
  const t = getTable()
  const type = getDbType()

  let result: Reminder | null
  if (type === 'sqlite') {
    const [row] = await db.delete(t).where(eq(t.id, id)).returning()
    result = (row as Reminder) ?? null
  }
  else {
    // Fetch before delete since MySQL has no RETURNING
    result = await getReminder(id)
    if (!result) return null
    await db.delete(t).where(eq(t.id, id))
  }
  if (result) reminderBus.emit('change')
  return result
}

export async function getDueReminders(): Promise<Reminder[]> {
  const db = await getDb()
  const t = getTable()
  const now = new Date().toISOString()
  return (await db
    .select()
    .from(t)
    .where(and(eq(t.status, 'pending'), lte(t.scheduledAt, now)))) as Reminder[]
}

export async function updateReminderSchedule(
  id: number,
  updates: { status?: ReminderStatus; scheduledAt?: string },
): Promise<void> {
  const db = await getDb()
  const t = getTable()
  await db.update(t).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(t.id, id))
  reminderBus.emit('change')
}
