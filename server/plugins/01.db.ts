import { getDb } from '../db/index'

export default defineNitroPlugin(async () => {
  // Pre-warm the DB connection at startup so the first request doesn't pay
  // the initialization cost. getDb() is self-initializing, so this is safe
  // to call regardless of plugin ordering.
  await getDb()
})
