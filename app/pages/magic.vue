<template><div /></template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = route.query.token as string | undefined

// Inject an inline script into the SSR HTML — fires before the Vue bundle loads,
// so the redirect happens immediately without waiting for hydration.
// Telegram bots do not execute JavaScript, so the token is not consumed by previews.
if (token) {
  useHead({
    script: [{ innerHTML: `window.location.replace('/api/auth/magic?token=${token}')` }],
  })
}

// Fallback: runs if the inline script is blocked (e.g. strict CSP)
onMounted(() => {
  if (!token) { navigateTo('/login'); return }
  window.location.href = `/api/auth/magic?token=${token}`
})
</script>
