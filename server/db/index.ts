import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (_db) return _db

  const dbPath = resolve(
    process.cwd(),
    process.env.DATABASE_PATH || './data/reminders.db',
  )

  const dir = dbPath.substring(0, dbPath.lastIndexOf('/'))
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })

  migrate(_db, {
    migrationsFolder: resolve(process.cwd(), './server/db/migrations'),
  })

  console.log(`[DB] SQLite connected: ${dbPath}`)
  return _db
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})
