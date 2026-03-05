import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const reminders = sqliteTable('reminders', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  chatId: text('chat_id').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  recurrence: text('recurrence', {
    enum: ['once', 'daily', 'weekly', 'monthly'],
  }).notNull().default('once'),
  status: text('status', {
    enum: ['pending', 'sent', 'cancelled'],
  }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
export type ReminderStatus = 'pending' | 'sent' | 'cancelled'
export type ReminderRecurrence = 'once' | 'daily' | 'weekly' | 'monthly'
