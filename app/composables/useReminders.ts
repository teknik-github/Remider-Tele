import type { Reminder, NewReminder } from '../../server/db/schema'

function is401(err: unknown): boolean {
  const e = err as { status?: number; statusCode?: number } | null
  return e?.status === 401 || e?.statusCode === 401
}

async function authFetch<T>(url: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
  try {
    return await $fetch<T>(url, opts)
  }
  catch (err: unknown) {
    if (is401(err)) {
      await navigateTo('/login')
    }
    throw err
  }
}

export function useReminders() {
  const remindersList = ref<Reminder[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      remindersList.value = await authFetch<Reminder[]>('/api/reminders')
    }
    catch (err: unknown) {
      if (!is401(err)) {
        error.value = (err as { statusMessage?: string })?.statusMessage || 'Failed to load reminders'
      }
    }
    finally {
      pending.value = false
    }
  }

  async function createReminder(data: Omit<NewReminder, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await authFetch<Reminder>('/api/reminders', {
      method: 'POST',
      body: data,
    })
    remindersList.value.unshift(result)
    return result
  }

  async function updateReminder(id: number, data: Partial<NewReminder>) {
    const result = await authFetch<Reminder>(`/api/reminders/${id}`, {
      method: 'PUT',
      body: data,
    })
    const idx = remindersList.value.findIndex(r => r.id === id)
    if (idx !== -1) remindersList.value[idx] = result
    return result
  }

  async function deleteReminder(id: number) {
    await authFetch(`/api/reminders/${id}`, { method: 'DELETE' })
    remindersList.value = remindersList.value.filter(r => r.id !== id)
  }

  async function cancelReminder(id: number) {
    return updateReminder(id, { status: 'cancelled' })
  }

  return {
    reminders: readonly(remindersList),
    pending: readonly(pending),
    error: readonly(error),
    fetchAll,
    createReminder,
    updateReminder,
    deleteReminder,
    cancelReminder,
  }
}
