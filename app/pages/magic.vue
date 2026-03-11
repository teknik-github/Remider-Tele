<template><div /></template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = route.query.token as string | undefined

// Inline script injected into the SSR HTML — fires before the Vue bundle loads,
// so the redirect starts immediately. Uses fetch() to POST the token (200 response),
// which ensures the Set-Cookie header is never stripped by reverse proxies.
// The __magicConsuming flag prevents onMounted from making a second request.
if (token) {
  useHead({
    script: [{
      innerHTML: `(async()=>{window.__magicConsuming=true;try{const r=await fetch('/api/auth/consume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:${JSON.stringify(token)}}),credentials:'same-origin'});window.location.replace(r.ok?'/':'/login');}catch{window.location.replace('/login');}})();`,
    }],
  })
}

// Fallback: runs only if the inline script is blocked (e.g. strict CSP).
onMounted(async () => {
  if ((window as any).__magicConsuming) return
  if (!token) { await navigateTo('/login'); return }
  try {
    await $fetch('/api/auth/consume', { method: 'POST', body: { token } })
    await navigateTo('/')
  }
  catch {
    await navigateTo('/login')
  }
})
</script>
