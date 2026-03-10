import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'

export type DbType = 'sqlite' | 'mysql' | 'mariadb'

export function getDbType(): DbType {
  const t = (process.env.DB_TYPE || 'sqlite').toLowerCase()
  if (t === 'mysql') return 'mysql'
  if (t === 'mariadb') return 'mariadb'
  return 'sqlite'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  if (!_db) throw new Error('[DB] Database not initialized. Ensure server/plugins/01.db.ts ran first.')
  return _db
}

export async function initDb(): Promise<void> {
  const type = getDbType()

  if (type === 'sqlite') {
    const { default: Database } = await import('better-sqlite3')
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
    const schema = await import('./schema.sqlite')

    const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH || './data/reminders.db')
    const dir = dbPath.substring(0, dbPath.lastIndexOf('/'))
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    _db = drizzle(sqlite, { schema })
    migrate(_db, { migrationsFolder: resolve(process.cwd(), './server/db/migrations') })
    console.log(`[DB] SQLite connected: ${dbPath}`)
  }
  else {
    const mysql = await import('mysql2/promise')
    const { drizzle } = await import('drizzle-orm/mysql2')
    const schema = await import('./schema.mysql')

    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'remindertele',
      waitForConnections: true,
      connectionLimit: 10,
    })

    // Run idempotent DDL — works on MySQL 8.0+ and MariaDB 10.2+
    const conn = await pool.getConnection()
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS reminders (
          id           INT          NOT NULL AUTO_INCREMENT,
          title        VARCHAR(255) NOT NULL,
          message      TEXT         NOT NULL,
          chat_id      VARCHAR(100) NOT NULL,
          scheduled_at VARCHAR(32)  NOT NULL,
          recurrence   ENUM('once','daily','weekly','monthly') NOT NULL DEFAULT 'once',
          status       ENUM('pending','sent','cancelled')      NOT NULL DEFAULT 'pending',
          notes        TEXT,
          created_at   VARCHAR(32)  NOT NULL DEFAULT '',
          updated_at   VARCHAR(32)  NOT NULL DEFAULT '',
          PRIMARY KEY (id),
          INDEX idx_status_scheduled (status, scheduled_at)
        )
      `)
    }
    finally {
      conn.release()
    }

    _db = drizzle(pool, { schema, mode: 'default' })
    const label = type === 'mariadb' ? 'MariaDB' : 'MySQL'
    console.log(`[DB] ${label} connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'remindertele'}`)
  }
}
