<template>
  <div>
    <div v-if="!reminders.length" class="text-center py-20 text-gray-400">
      <div class="text-5xl mb-4">🔔</div>
      <p class="text-lg font-medium">No reminders yet</p>
      <p class="text-sm mt-1">Click "New Reminder" to get started</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ReminderCard
        v-for="reminder in reminders"
        :key="reminder.id"
        :reminder="reminder"
        @edit="$emit('edit', $event)"
        @reuse="$emit('reuse', $event)"
        @delete="$emit('delete', $event)"
        @cancel="$emit('cancel', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '../../server/db/schema'

defineProps<{ reminders: Reminder[] }>()
defineEmits<{
  (e: 'edit', reminder: Reminder): void
  (e: 'reuse', reminder: Reminder): void
  (e: 'delete', id: number): void
  (e: 'cancel', id: number): void
}>()
</script>
