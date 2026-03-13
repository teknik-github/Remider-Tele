import { reminderBus } from '../../utils/reminderBus'

export default defineEventHandler(async (event) => {
  const stream = createEventStream(event)

  const handler = () => stream.push('change').catch(() => {})

  reminderBus.on('change', handler)

  // Heartbeat every 25 s — keeps the connection alive through reverse proxies
  const heartbeat = setInterval(() => stream.push('heartbeat').catch(() => {}), 25_000)

  stream.onClosed(async () => {
    clearInterval(heartbeat)
    reminderBus.off('change', handler)
    await stream.close()
  })

  return stream.send()
})
