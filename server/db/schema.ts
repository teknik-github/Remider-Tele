export type ReminderStatus = 'pending' | 'sent' | 'cancelled'
export type ReminderRecurrence = 'once' | 'daily' | 'weekly' | 'monthly'

export interface Reminder {
  id: number
  title: string
  message: string
  chatId: string
  scheduledAt: string
  recurrence: ReminderRecurrence
  status: ReminderStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type NewReminder = {
  title: string
  message: string
  chatId: string
  scheduledAt: string
  recurrence?: ReminderRecurrence
  status?: ReminderStatus
  notes?: string | null
}
