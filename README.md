# Reminder-Tele

A Skeddy-like Telegram reminder scheduler built with Nuxt 3. Create reminders via a web dashboard and receive them as Telegram messages at the scheduled time. Supports recurring reminders (daily, weekly, monthly) and quick-pick time presets.

![Dashboard screenshot](./public/image.png)

---

## Features

- **Web dashboard** — create, view, edit, cancel, and delete reminders
- **Quick time presets** — +15 min, +1 hr, Tomorrow 8am, Next Mon 9am, etc.
- **Recurrence** — once, daily, weekly, monthly
- **Login protection** — password-protected dashboard with HTTP-only cookie sessions
- **Magic link via Telegram** — send `/web` to your bot to get a one-time login URL (valid 10 min)
- **Magic link via API** — `POST /api/generate` with an API key returns a one-time login URL (for automation/Postman)
- **Edit reminders** — edit any reminder; editing a sent/cancelled reminder resets it to pending and reschedules it
- **Auto-refresh** — dashboard polls every 30 seconds so status updates without manual refresh
- **Telegram delivery** — sends messages via Telegram Bot API every minute via cron
- **Multi-database** — SQLite (default), MySQL, or MariaDB; selected via `DB_TYPE` env var
- **Auto-migration** — database schema is applied automatically on first boot

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (full-stack, Nitro server) |
| Database | SQLite / MySQL / MariaDB via Drizzle ORM |
| Scheduler | node-cron (every minute) |
| Messaging | Telegram Bot API (node-telegram-bot-api) |
| Styling | Tailwind CSS |

---

## Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram chat ID (send a message to your bot, then check `getUpdates`)
- For MySQL/MariaDB: a running database server (MySQL 8.0+ or MariaDB 10.2+)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_DEFAULT_CHAT_ID=987654321
DASHBOARD_PASSWORD=your_secure_password
APP_URL=https://yourdomain.com
API_KEY=your_api_key_here

# Database (SQLite default — no extra config needed)
DB_TYPE=sqlite
DATABASE_PATH=./data/reminders.db
```

> **Note:** If `DASHBOARD_PASSWORD` is left empty, the dashboard is open with no authentication required.

**How to get your chat ID:**
1. Start your bot in Telegram (send `/start`)
2. Open: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat": { "id": ... }` in the response

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The database is created and migrated automatically on first run.

---

## Production

Build and run:

```bash
npm run build
node .output/server/index.mjs
```

---

## Database Configuration

Set `DB_TYPE` in `.env` to choose your database engine.

### SQLite (default)

```env
DB_TYPE=sqlite
DATABASE_PATH=./data/reminders.db
```

No external server needed. The file is created automatically.

### MySQL or MariaDB

```env
DB_TYPE=mysql       # or: mariadb
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=remindertele
```

The `reminders` table is created automatically on first boot. Requires MySQL 8.0+ or MariaDB 10.2+.

---

## Project Structure

```
Remider-Tele/
├── app/
│   ├── app.vue                    # Root component
│   ├── pages/
│   │   ├── index.vue              # Main dashboard
│   │   ├── login.vue              # Login page
│   │   └── magic.vue              # Magic link handler (instant redirect)
│   ├── middleware/
│   │   └── auth.global.ts         # Redirects to /login if no valid session
│   ├── components/
│   │   ├── ReminderForm.vue       # Create/edit reminder modal
│   │   ├── ReminderCard.vue       # Single reminder card with actions
│   │   ├── ReminderList.vue       # Grid of cards
│   │   └── StatusBadge.vue        # Status pill (pending/sent/cancelled)
│   └── composables/
│       └── useReminders.ts        # API fetch wrappers
├── server/
│   ├── plugins/
│   │   ├── 01.db.ts               # Async DB initialization (runs first)
│   │   ├── scheduler.ts           # Starts cron job on server boot
│   │   └── telegramCommands.ts    # Polling bot — handles /web command
│   ├── middleware/
│   │   └── auth.ts                # Protects /api/reminders/* routes (401 if no session)
│   ├── db/
│   │   ├── schema.ts              # Shared TypeScript types
│   │   ├── schema.sqlite.ts       # SQLite table definition
│   │   ├── schema.mysql.ts        # MySQL/MariaDB table definition
│   │   ├── index.ts               # Multi-adapter DB factory (initDb / getDb)
│   │   ├── ops.ts                 # Dialect-aware CRUD operations
│   │   └── migrations/            # SQLite migration files
│   ├── api/
│   │   ├── generate.post.ts       # POST /api/generate — API key → magic URL
│   │   ├── reminders/             # REST endpoints (CRUD)
│   │   └── auth/
│   │       ├── login.post.ts      # Password login → sets session cookie
│   │       ├── logout.post.ts     # Clears session cookie
│   │       ├── check.get.ts       # Verify session (used by frontend middleware)
│   │       └── magic.get.ts       # One-time token → sets cookie → redirect to /
│   └── utils/
│       ├── telegram.ts            # Send-only bot singleton + sendMessage
│       ├── scheduler.ts           # Cron logic + recurrence handling
│       ├── auth.ts                # Session token helpers (HMAC, cookie helpers)
│       └── magicLinks.ts          # In-memory one-time token store
├── data/reminders.db              # SQLite database (auto-created, gitignored)
├── .env                           # Your credentials (gitignored)
└── .env.example                   # Template
```

---

## API Endpoints

### Reminders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders` | List all reminders |
| `POST` | `/api/reminders` | Create a reminder |
| `GET` | `/api/reminders/:id` | Get a single reminder |
| `PUT` | `/api/reminders/:id` | Update a reminder |
| `DELETE` | `/api/reminders/:id` | Delete a reminder |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Submit password → set session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/check` | Returns `{ ok: true/false }` |
| `GET` | `/api/auth/magic?token=` | Verify one-time token → set cookie → redirect to `/` |

### Generate (API key protected)

| Method | Endpoint | Header | Description |
|---|---|---|---|
| `POST` | `/api/generate` | `x-api-key: <API_KEY>` | Returns a one-time magic login URL |

**Request:**
```
POST /api/generate
x-api-key: your_api_key_here
```

**Response `200`:**
```json
{ "url": "https://yourdomain.com/magic?token=<64-hex-chars>" }
```

**Errors:** `401` wrong/missing key · `503` `API_KEY` or `APP_URL` not set

Generate a strong API key:
```bash
openssl rand -hex 32
```

### Create reminder body

```json
{
  "title": "Take medication",
  "message": "Time to take your evening pills 💊",
  "scheduledAt": "2026-03-06T20:00:00.000Z",
  "recurrence": "daily",
  "notes": "Optional private note"
}
```

### Update reminder body (all fields optional)

```json
{
  "title": "Updated title",
  "scheduledAt": "2026-03-07T08:00:00.000Z",
  "status": "pending"
}
```

> **Reschedule tip:** To reschedule a sent/cancelled reminder, send a `PUT` with a new `scheduledAt` and `"status": "pending"`. The dashboard Edit form does this automatically.

---

## Reminder Schema

| Field | Type | Values |
|---|---|---|
| `title` | string | Display name |
| `message` | string | Text sent to Telegram |
| `scheduledAt` | ISO 8601 string | When to send |
| `recurrence` | enum | `once` / `daily` / `weekly` / `monthly` |
| `status` | enum | `pending` / `sent` / `cancelled` |
| `notes` | string | Private note, not sent to Telegram |

---

## Dashboard Behaviour

| Action | Available on | Result |
|---|---|---|
| **Edit** | All reminders | Opens pre-filled form; saving a sent/cancelled reminder resets it to `pending` |
| **Cancel** | Pending only | Sets status to `cancelled` immediately |
| **Delete** | All reminders | Permanently removes the reminder |
| **Auto-refresh** | Always | Dashboard re-fetches data every 30 seconds automatically |

---

## How the Scheduler Works

1. A Nitro server plugin starts `node-cron` when the server boots
2. Every minute, it queries for reminders where `status = 'pending'` AND `scheduled_at <= now()`
3. Each due reminder is sent to Telegram via the Bot API
4. **One-time** reminders → marked `sent`
5. **Recurring** reminders → `scheduled_at` is advanced to the next occurrence, stays `pending`
6. On startup, the scheduler runs immediately to catch any reminders missed during downtime

---

## Telegram Commands

| Command | Description |
|---|---|
| `/web` | Generates a one-time magic link to open the dashboard without entering a password |

Magic link flow:
1. Send `/web` to the bot in Telegram
2. Bot replies with a one-time URL (no link preview shown)
3. Tap the link → redirected instantly to the dashboard (session cookie is set automatically)

Magic links expire after **10 minutes** and are **single-use**. Requires `APP_URL` to be set in `.env`.

---

## Telegram Integration Notes

- The scheduler bot runs in **send-only mode** (`polling: false`)
- The commands bot runs in **polling mode** to receive `/web` messages
- The `/web` command is restricted to `TELEGRAM_DEFAULT_CHAT_ID` — other senders are silently ignored
- The default chat ID is set via `TELEGRAM_DEFAULT_CHAT_ID` in `.env`
- The user must send `/start` to the bot before it can send messages
- Messages are formatted with Telegram Markdown

---

## Security

| Feature | Details |
|---|---|
| Session tokens | HMAC-SHA256 derived from password, stored as HTTP-only cookie |
| Password comparison | `crypto.timingSafeEqual` — resistant to timing attacks |
| API key comparison | `crypto.timingSafeEqual` — same protection on `/api/generate` |
| Brute-force protection | 5 failed login attempts → 15-minute lockout per IP |
| Secure cookie flag | Set automatically when `NODE_ENV=production` |
| `/web` restriction | Bot only responds to the configured `TELEGRAM_DEFAULT_CHAT_ID` |
| Magic link safety | Tokens are single-use and expire after 10 minutes |
