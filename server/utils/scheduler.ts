import cron from 'node-cron'
import { eq, and, lte } from 'drizzle-orm'
import { getDb } from '../db/index'
import { reminders } from '../db/schema'
import { sendTelegramMessage, formatReminderMessage } from './telegram'
import dayjs from 'dayjs'

function computeNextScheduledAt(current: string, recurrence: string): string {
  const d = dayjs(current)
  switch (recurrence) {
    case 'daily': return d.add(1, 'day').toISOString()
    case 'weekly': return d.add(1, 'week').toISOString()
    case 'monthly': return d.add(1, 'month').toISOString()
    default: return current
  }
}

export async function processDueReminders(): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()

  try {
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, 'pending'),
          lte(reminders.scheduledAt, now),
        ),
      )

    if (dueReminders.length === 0) return

    console.log(`[Scheduler] Processing ${dueReminders.length} due reminder(s)`)

    for (const reminder of dueReminders) {
      const text = formatReminderMessage(reminder)
      const success = await sendTelegramMessage(reminder.chatId, text)

      if (success) {
        if (reminder.recurrence === 'once') {
          await db
            .update(reminders)
            .set({ status: 'sent', updatedAt: new Date().toISOString() })
            .where(eq(reminders.id, reminder.id))
        }
        else {
          const nextAt = computeNextScheduledAt(reminder.scheduledAt, reminder.recurrence)
          await db
            .update(reminders)
            .set({ scheduledAt: nextAt, updatedAt: new Date().toISOString() })
            .where(eq(reminders.id, reminder.id))
          console.log(`[Scheduler] Recurring #${reminder.id} rescheduled to ${nextAt}`)
        }
      }
    }
  }
  catch (err) {
    console.error('[Scheduler] Error:', err)
  }
}

let _cronTask: cron.ScheduledTask | null = null

export function startScheduler(): void {
  if (_cronTask) return

  // Run immediately on startup to catch missed reminders
  processDueReminders()

  _cronTask = cron.schedule('* * * * *', async () => {
    await processDueReminders()
  })

  console.log('[Scheduler] Cron job started — checking every minute')
}

export function stopScheduler(): void {
  if (_cronTask) {
    _cronTask.stop()
    _cronTask = null
    console.log('[Scheduler] Stopped')
  }
}
