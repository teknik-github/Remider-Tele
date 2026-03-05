// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || '',
    databasePath: process.env.DATABASE_PATH || './data/reminders.db',
    dashboardPassword: process.env.DASHBOARD_PASSWORD || '',
    public: {
      appName: 'Reminder-Tele',
    },
  },

  nitro: {
    externals: {
      external: ['better-sqlite3', 'node-cron', 'node-telegram-bot-api'],
    },
  },

  typescript: {
    strict: true,
    shim: false,
  },
})
