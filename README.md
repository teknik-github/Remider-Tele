# Reminder-Tele

A Skeddy-like Telegram reminder scheduler built with Nuxt 4. Create reminders via a web dashboard and receive them as Telegram messages at the scheduled time. Supports recurring reminders (daily, weekly, monthly) and quick-pick time presets.

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
- **Real-time sync** — dashboard updates instantly via Server-Sent Events (SSE); no polling, no manual refresh needed
- **Telegram delivery** — sends messages via Telegram Bot API every minute via cron
- **Multi-database** — SQLite (default), MySQL, or MariaDB; selected via `DB_TYPE` env var
- **Auto-migration** — database schema is applied automatically on first boot

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (full-stack, Nitro server, `app/` directory layout) |
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

### Option A — Docker (recommended)

```bash
cp .env.example .env   # fill in your credentials

docker compose up -d   # build image and start in background
docker compose logs -f # tail logs
docker compose down    # stop (data volume is preserved)
```

The SQLite database is stored in a named Docker volume (`db_data`) so it survives restarts and `docker compose down`. To wipe the database: `docker compose down -v`.

### Option B — Build from source

```bash
npm run build
node .output/server/index.mjs
```

### nginx / reverse proxy

The SSE stream at `/api/reminders/stream` requires response buffering to be disabled. Add these directives to your location block:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_buffering off;
    proxy_read_timeout 3600;
    # ... other proxy settings
}
```

Without `proxy_buffering off`, nginx buffers the response and the client never receives SSE events.

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
│   │   └── login.vue              # Login page
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
│   ├── routes/
│   │   └── magic.get.ts           # GET /magic?token= — validates token, sets cookie in 200 document response, redirects to /
│   ├── db/
│   │   ├── schema.ts              # Shared TypeScript types
│   │   ├── schema.sqlite.ts       # SQLite table definition
│   │   ├── schema.mysql.ts        # MySQL/MariaDB table definition
│   │   ├── index.ts               # Multi-adapter DB factory (initDb / getDb)
│   │   ├── ops.ts                 # Dialect-aware CRUD operations
│   │   └── migrations/            # SQLite migration files
│   ├── api/
│   │   ├── generate.post.ts       # POST /api/generate — API key → magic URL
│   │   ├── reminders/
│   │   │   ├── index.get.ts       # GET  /api/reminders
│   │   │   ├── index.post.ts      # POST /api/reminders
│   │   │   ├── [id].get.ts        # GET  /api/reminders/:id
│   │   │   ├── [id].put.ts        # PUT  /api/reminders/:id
│   │   │   ├── [id].delete.ts     # DELETE /api/reminders/:id
│   │   │   └── stream.get.ts      # GET  /api/reminders/stream — SSE change feed
│   │   └── auth/
│   │       ├── login.post.ts      # Password login → sets session cookie
│   │       ├── logout.post.ts     # Clears session cookie
│   │       └── check.get.ts       # Verify session (used by frontend middleware)
│   └── utils/
│       ├── telegram.ts            # Send-only bot singleton + sendMessage
│       ├── scheduler.ts           # Cron logic + recurrence handling
│       ├── auth.ts                # Session token helpers (HMAC, cookie helpers)
│       ├── magicLinks.ts          # In-memory one-time token store
│       └── reminderBus.ts         # Node.js EventEmitter — broadcasts DB changes to SSE clients
├── data/reminders.db              # SQLite database (auto-created, gitignored)
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Compose file (app + named volume)
├── .dockerignore                  # Excludes node_modules, .output, data, .env
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

### Magic link

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/magic?token=` | Validate one-time token → set `Set-Cookie` in the 200 document response → redirect to `/` |

### SSE

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders/stream` | Server-Sent Events stream — pushes `change` on any reminder mutation |

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
| **Real-time sync** | Always | Dashboard re-fetches silently via SSE whenever any reminder changes |
| **Manual refresh** | Always | ↻ Refresh button re-fetches silently without any loading indicator |

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
3. Tap the link → Nitro server route validates the token and sets `Set-Cookie` in the `200` HTML document response (same response the browser receives on navigation — never stripped by proxies)
4. Browser auto-redirects to the dashboard via inline JS + `<meta http-equiv="refresh">` fallback

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

---

## Changelog

### v1.5.0 — Docker support
- Added `Dockerfile` — multi-stage build (Node 22 Alpine); stage 1 compiles the app, stage 2 ships only `.output/`
- Added `docker-compose.yml` — single-service compose with named volume for SQLite persistence
- Added `.dockerignore` — excludes `node_modules`, `.output`, `data/`, `.env`

### v1.4.0 — Server-route magic link (proxy-proof cookie)
- Replaced `app/pages/magic.vue` + AJAX `/api/auth/consume` with a pure Nitro server route (`server/routes/magic.get.ts`)
- The route validates the token, sets `Set-Cookie` in the **200 HTML document response**, then serves a JS/meta-refresh redirect to `/`
- Cookie now rides in the main page-load response — nginx/Kubernetes proxies never strip cookies from document responses
- Eliminates remaining failure mode where proxies stripped `Set-Cookie` from AJAX 200 responses

### v1.3.0 — Real-time sync via SSE
- Replaced 30-second polling with Server-Sent Events (`/api/reminders/stream`)
- Dashboard updates instantly on any create / update / delete / scheduler fire
- Added `server/utils/reminderBus.ts` — module-level EventEmitter shared across all server ops
- All DB mutations in `server/db/ops.ts` emit `'change'` to connected SSE clients
- Manual ↻ Refresh is now silent (no loading spinner or disabled state)

### v1.2.0 — Proxy-safe magic link
- Added `POST /api/auth/consume` endpoint — returns `200 + Set-Cookie` instead of a `302` redirect so cookies are never stripped by nginx or Kubernetes ingress
- Updated `app/pages/magic.vue` to use an inline `fetch` POST for immediate execution (fires before Vue bundle loads), with `onMounted` as a CSP fallback
- Fixed blank-page issue when accessing magic links through a reverse proxy

### v1.1.0 — Silent refresh & auth hardening
- `fetchAll(silent)` parameter — skips `pending` state when `true` so background refreshes are invisible
- `authFetch` wrapper in `useReminders.ts` redirects to `/login` on any `401` response
- Multi-database support: SQLite (default), MySQL, MariaDB via `DB_TYPE` env var
- Brute-force protection: 5 failed logins → 15-minute IP lockout

### v1.0.0 — Initial release
- Web dashboard: create, view, edit, cancel, delete reminders
- Telegram delivery via cron (every minute) with recurrence support (once / daily / weekly / monthly)
- Password-protected dashboard with HMAC-SHA256 session tokens
- Magic link login via `/web` Telegram command
- Magic link via API (`POST /api/generate`) for automation
- SQLite with Drizzle ORM and auto-migration
