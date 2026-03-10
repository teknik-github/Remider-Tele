import { initDb } from '../db/index'

export default defineNitroPlugin(async () => {
  await initDb()
})
