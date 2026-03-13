import { EventEmitter } from 'node:events'

export const reminderBus = new EventEmitter()
reminderBus.setMaxListeners(100) // one listener per connected SSE client
