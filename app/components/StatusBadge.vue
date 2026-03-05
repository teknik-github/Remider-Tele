<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusClass]">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: 'pending' | 'sent' | 'cancelled' }>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'pending':   return 'bg-yellow-100 text-yellow-800'
    case 'sent':      return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-gray-100 text-gray-500 line-through'
    default:          return 'bg-gray-100 text-gray-700'
  }
})
</script>
