import { deleteReminder } from '../../db/ops'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const deleted = await deleteReminder(id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Reminder not found' })

  return { success: true, deleted }
})
