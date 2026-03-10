import { mysqlTable, text, int, varchar, mysqlEnum } from 'drizzle-orm/mysql-core'

export const reminders = mysqlTable('reminders', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  chatId: varchar('chat_id', { length: 100 }).notNull(),
  scheduledAt: varchar('scheduled_at', { length: 32 }).notNull(),
  recurrence: mysqlEnum('recurrence', ['once', 'daily', 'weekly', 'monthly']).notNull().default('once'),
  status: mysqlEnum('status', ['pending', 'sent', 'cancelled']).notNull().default('pending'),
  notes: text('notes'),
  createdAt: varchar('created_at', { length: 32 }).notNull().default(''),
  updatedAt: varchar('updated_at', { length: 32 }).notNull().default(''),
})
