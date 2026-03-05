<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">{{ reminder ? 'Edit Reminder' : prefill ? 'Use Again' : 'New Reminder' }}</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Meeting reminder, take meds, etc."
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              v-model="form.message"
              required
              rows="3"
              placeholder="The message text that will be sent to Telegram..."
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Schedule *</label>
            <!-- Quick time presets -->
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="preset in timePresets"
                :key="preset.label"
                type="button"
                @click="applyPreset(preset)"
                :class="[
                  'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                  activePreset === preset.label
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
            <!-- Exact datetime input -->
            <input
              v-model="form.scheduledAt"
              type="datetime-local"
              required
              :min="minDateTime"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="activePreset = null"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="opt in recurrenceOptions"
                :key="opt.value"
                type="button"
                @click="form.recurrence = opt.value"
                :class="[
                  'py-2 rounded-lg text-xs font-medium border transition-all',
                  form.recurrence === opt.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300',
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Notes <span class="text-gray-400 font-normal">(optional, not sent)</span>
            </label>
            <input
              v-model="form.notes"
              type="text"
              placeholder="Private notes..."
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {{ formError }}
          </p>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Saving...' : reminder ? 'Save Changes' : 'Create Reminder' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Reminder } from '../../server/db/schema'

const props = defineProps<{ open: boolean; reminder?: Reminder; prefill?: Reminder }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const { createReminder, updateReminder } = useReminders()

const recurrenceOptions = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const

type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly'

const form = reactive({
  title: '',
  message: '',
  scheduledAt: '',
  recurrence: 'once' as Recurrence,
  notes: '',
})

const submitting = ref(false)
const formError = ref('')
const activePreset = ref<string | null>(null)

const minDateTime = computed(() => new Date().toISOString().slice(0, 16))

// Convert a Date to the "YYYY-MM-DDTHH:MM" string datetime-local expects
function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Returns a Date at a specific hour/minute on a given day
function atTime(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

const timePresets = [
  { label: '+15 min', apply: () => new Date(Date.now() + 15 * 60_000) },
  { label: '+30 min', apply: () => new Date(Date.now() + 30 * 60_000) },
  { label: '+1 hr',   apply: () => new Date(Date.now() + 60 * 60_000) },
  { label: '+3 hr',   apply: () => new Date(Date.now() + 3 * 60 * 60_000) },
  { label: 'Tonight 8pm', apply: () => atTime(new Date(), 20) },
  { label: 'Tomorrow 8am', apply: () => { const d = new Date(); d.setDate(d.getDate() + 1); return atTime(d, 8) } },
  { label: 'Tomorrow noon', apply: () => { const d = new Date(); d.setDate(d.getDate() + 1); return atTime(d, 12) } },
  { label: 'Tomorrow 6pm', apply: () => { const d = new Date(); d.setDate(d.getDate() + 1); return atTime(d, 18) } },
  { label: 'Next Mon 9am', apply: () => { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() + ((8 - day) % 7 || 7)); return atTime(d, 9) } },
]

function applyPreset(preset: typeof timePresets[number]) {
  form.scheduledAt = toLocalDatetimeInput(preset.apply())
  activePreset.value = preset.label
}

function resetForm() {
  form.title = ''
  form.message = ''
  form.scheduledAt = ''
  form.recurrence = 'once'
  form.notes = ''
  formError.value = ''
  activePreset.value = null
}

// Pre-fill form when opening
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  formError.value = ''
  activePreset.value = null
  if (props.reminder) {
    // Edit mode: pre-fill all fields including time
    form.title = props.reminder.title
    form.message = props.reminder.message
    form.scheduledAt = toLocalDatetimeInput(new Date(props.reminder.scheduledAt))
    form.recurrence = props.reminder.recurrence as Recurrence
    form.notes = props.reminder.notes ?? ''
  }
  else if (props.prefill) {
    // Reuse mode: pre-fill content, leave time blank for user to pick
    form.title = props.prefill.title
    form.message = props.prefill.message
    form.scheduledAt = ''
    form.recurrence = props.prefill.recurrence as Recurrence
    form.notes = props.prefill.notes ?? ''
  }
  else {
    resetForm()
  }
})

async function handleSubmit() {
  formError.value = ''
  submitting.value = true
  try {
    if (props.reminder) {
      await updateReminder(props.reminder.id, {
        title: form.title,
        message: form.message,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recurrence: form.recurrence,
        notes: form.notes || null,
        // Re-activate if editing a sent/cancelled reminder
        ...(props.reminder.status !== 'pending' ? { status: 'pending' } : {}),
      })
      emit('updated')
    }
    else {
      await createReminder({
        title: form.title,
        message: form.message,
        chatId: '',
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recurrence: form.recurrence,
        status: 'pending',
        notes: form.notes || null,
      })
      emit('created')
    }
    emit('close')
    resetForm()
  }
  catch (err: unknown) {
    formError.value = (err as { statusMessage?: string })?.statusMessage || 'Failed to save reminder'
  }
  finally {
    submitting.value = false
  }
}
</script>
