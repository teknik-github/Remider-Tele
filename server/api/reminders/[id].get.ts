import { getReminder } from '../../db/ops'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const reminder = await getReminder(id)
  if (!reminder) throw createError({ statusCode: 404, statusMessage: 'Reminder not found' })

  return reminder
})
