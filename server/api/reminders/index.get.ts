import { listReminders } from '../../db/ops'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return listReminders(query.status as string | undefined)
})
