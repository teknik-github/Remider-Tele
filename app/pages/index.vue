<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <span class="font-bold text-gray-900 text-lg">Reminder-Tele</span>
          <span class="hidden sm:block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Telegram Scheduler
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showForm = true"
            class="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <span class="text-lg leading-none">+</span>
            New Reminder
          </button>
          <button
            @click="handleLogout"
            class="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center cursor-pointer transition-all select-none"
          :class="activeFilter === stat.filter ? 'ring-2 ring-blue-400 border-blue-200' : 'hover:shadow-md'"
          @click="toggleFilter(stat.filter)"
        >
          <div class="text-2xl font-bold" :class="stat.color">{{ stat.count }}</div>
          <div class="text-xs text-gray-500 mt-0.5 font-medium">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Section header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-700">
          {{ activeFilter ? `${activeFilter} reminders` : 'All reminders' }}
          <span class="text-gray-400 font-normal text-sm ml-1">({{ filteredReminders.length }})</span>
        </h2>
        <button
          @click="fetchAll"
          :disabled="pending"
          class="text-xs text-gray-400 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          {{ pending ? 'Loading...' : '↻ Refresh' }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
        {{ error }}
      </div>

      <!-- Loading skeleton -->
      <div v-if="pending && !reminders.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 6" :key="n" class="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-44" />
      </div>

      <!-- Reminder list -->
      <ReminderList
        v-else
        :reminders="filteredReminders as Reminder[]"
        @edit="handleEdit"
        @reuse="handleReuse"
        @delete="handleDelete"
        @cancel="handleCancel"
      />
    </main>

    <!-- Modal -->
    <ReminderForm
      :open="showForm"
      :reminder="editingReminder"
      :prefill="reuseReminder"
      @close="handleFormClose"
      @created="fetchAll"
      @updated="fetchAll"
    />
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '../../server/db/schema'

useHead({
  title: 'Reminder-Tele — Telegram Scheduler',
})

const { reminders, pending, error, fetchAll, deleteReminder, cancelReminder } = useReminders()

const showForm = ref(false)
const editingReminder = ref<Reminder | undefined>(undefined)
const reuseReminder = ref<Reminder | undefined>(undefined)
const activeFilter = ref<string | null>(null)

const stats = computed(() => [
  {
    label: 'Pending',
    filter: 'pending',
    count: reminders.value.filter(r => r.status === 'pending').length,
    color: 'text-yellow-500',
  },
  {
    label: 'Sent',
    filter: 'sent',
    count: reminders.value.filter(r => r.status === 'sent').length,
    color: 'text-green-500',
  },
  {
    label: 'Cancelled',
    filter: 'cancelled',
    count: reminders.value.filter(r => r.status === 'cancelled').length,
    color: 'text-gray-400',
  },
])

const filteredReminders = computed(() => {
  if (!activeFilter.value) return reminders.value
  return reminders.value.filter(r => r.status === activeFilter.value)
})

function toggleFilter(filter: string) {
  activeFilter.value = activeFilter.value === filter ? null : filter
}

function handleEdit(reminder: Reminder) {
  editingReminder.value = reminder
  showForm.value = true
}

function handleReuse(reminder: Reminder) {
  reuseReminder.value = reminder
  editingReminder.value = undefined
  showForm.value = true
}

function handleFormClose() {
  showForm.value = false
  editingReminder.value = undefined
  reuseReminder.value = undefined
}

async function handleDelete(id: number) {
  if (!confirm('Delete this reminder permanently?')) return
  await deleteReminder(id)
}

async function handleCancel(id: number) {
  await cancelReminder(id)
}

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

let pollInterval: ReturnType<typeof setInterval>

onMounted(() => {
  fetchAll()
  pollInterval = setInterval(() => fetchAll(), 30_000)
})

onUnmounted(() => clearInterval(pollInterval))
</script>
