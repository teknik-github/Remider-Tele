export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  try {
    const result = await $fetch<{ ok: boolean }>('/api/auth/check')
    if (!result.ok) return navigateTo('/login')
  }
  catch {
    return navigateTo('/login')
  }
})
