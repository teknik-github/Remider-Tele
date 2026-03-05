export default defineNitroPlugin((_nitroApp) => {
  import('../utils/scheduler').then(({ startScheduler }) => {
    startScheduler()
  }).catch((err) => {
    console.error('[Plugin] Failed to start scheduler:', err)
  })
})
