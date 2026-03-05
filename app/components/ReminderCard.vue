<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200 group"
    :class="{ 'opacity-60': reminder.status !== 'pending' }"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 truncate text-base leading-tight">
          {{ reminder.title }}
        </h3>
      </div>
      <StatusBadge :status="reminder.status" />
    </div>

    <p class="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
      {{ reminder.message }}
    </p>

    <div class="flex items-center justify-between">
      <div class="text-xs text-gray-400 space-y-0.5">
        <div>📅 {{ formatDate(reminder.scheduledAt) }}</div>
        <div v-if="reminder.recurrence !== 'once'" class="text-blue-500">
          🔁 {{ reminder.recurrence }}
        </div>
      </div>

      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          @click="$emit('edit', reminder)"
          class="text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1 rounded hover:bg-blue-50"
        >
          Edit
        </button>
        <button
          v-if="reminder.status !== 'pending'"
          @click="$emit('reuse', reminder)"
          class="text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50"
        >
          Use again
        </button>
        <button
          v-if="reminder.status === 'pending'"
          @click="$emit('cancel', reminder.id)"
          class="text-xs text-gray-400 hover:text-orange-500 transition-colors px-2 py-1 rounded hover:bg-orange-50"
        >
          Cancel
        </button>
        <button
          @click="$emit('delete', reminder.id)"
          class="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '../../server/db/schema'

defineProps<{ reminder: Reminder }>()
defineEmits<{
  (e: 'edit', reminder: Reminder): void
  (e: 'reuse', reminder: Reminder): void
  (e: 'delete', id: number): void
  (e: 'cancel', id: number): void
}>()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
