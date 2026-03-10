export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/magic') return

  try {
    // Forward cookies to the internal API call during SSR
    const headers = useRequestHeaders(['cookie'])
    const result = await $fetch<{ ok: boolean }>('/api/auth/check', { headers })
    if (!result.ok) return navigateTo('/login')
  }
  catch {
    return navigateTo('/login')
  }
})
