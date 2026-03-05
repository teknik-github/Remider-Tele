<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3">
          T
        </div>
        <h1 class="text-xl font-bold text-gray-900">Reminder-Tele</h1>
        <p class="text-sm text-gray-400 mt-1">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autofocus
            placeholder="Enter your password"
            class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'Sign in — Reminder-Tele' })

const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value },
    })
    await navigateTo('/')
  }
  catch (err: unknown) {
    error.value = (err as { statusMessage?: string })?.statusMessage || 'Login failed'
  }
  finally {
    loading.value = false
  }
}
</script>
