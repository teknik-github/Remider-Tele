import TelegramBot from 'node-telegram-bot-api'

let _bot: TelegramBot | null = null

export function getTelegramBot(): TelegramBot {
  if (_bot) return _bot

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('[Telegram] TELEGRAM_BOT_TOKEN is not set')
  }

  _bot = new TelegramBot(token, { polling: false })
  console.log('[Telegram] Bot initialized (send-only mode)')
  return _bot
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const bot = getTelegramBot()
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
    console.log(`[Telegram] Message sent to chat ${chatId}`)
    return true
  }
  catch (err: unknown) {
    const tgErr = err as { code?: string; response?: { statusCode?: number; body?: string } }
    const statusCode = tgErr?.response?.statusCode
    const body = tgErr?.response?.body

    if (statusCode === 404) {
      console.error(
        `[Telegram] 404 for chat ${chatId} — bot cannot reach this chat.\n` +
        `  → The user must send /start to the bot first, or the chat ID is wrong.\n` +
        `  → Verify at: https://api.telegram.org/bot<TOKEN>/getUpdates`,
      )
    }
    else if (statusCode === 403) {
      console.error(`[Telegram] 403 for chat ${chatId} — bot was blocked by the user.`)
    }
    else {
      console.error(`[Telegram] Failed to send to chat ${chatId} (${statusCode}):`, body || err)
    }
    return false
  }
}

export function formatReminderMessage(reminder: {
  title: string
  message: string
  scheduledAt: string
  recurrence: string
}): string {
  const recurrenceLabel = reminder.recurrence === 'once' ? '' : ` _(${reminder.recurrence})_`
  return `🔔 *${reminder.title}*${recurrenceLabel}\n\n${reminder.message}`
}
