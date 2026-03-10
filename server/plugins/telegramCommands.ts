import TelegramBot from 'node-telegram-bot-api'
import { createMagicToken } from '../utils/magicLinks'

export default defineNitroPlugin(() => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const appUrl = process.env.APP_URL?.replace(/\/$/, '')

  if (!token) {
    console.warn('[TelegramCommands] TELEGRAM_BOT_TOKEN not set — commands disabled')
    return
  }
  if (!appUrl) {
    console.warn('[TelegramCommands] APP_URL not set — /web command disabled')
    return
  }

  const bot = new TelegramBot(token, { polling: true })

  bot.onText(/\/web/, async (msg) => {
    const allowedChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID
    if (allowedChatId && msg.chat.id.toString() !== allowedChatId) return

    const chatId = msg.chat.id
    const magicToken = createMagicToken()
    const url = `${appUrl}/magic?token=${magicToken}`

    await bot.sendMessage(
      chatId,
      `${url}`,
      { parse_mode: 'Markdown', disable_web_page_preview: true },
    )
  })

  console.log('[TelegramCommands] Polling started — listening for commands')
})
