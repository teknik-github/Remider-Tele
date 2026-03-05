CREATE TABLE IF NOT EXISTS `reminders` (
  `id`           INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title`        TEXT NOT NULL,
  `message`      TEXT NOT NULL,
  `chat_id`      TEXT NOT NULL,
  `scheduled_at` TEXT NOT NULL,
  `recurrence`   TEXT NOT NULL DEFAULT 'once',
  `status`       TEXT NOT NULL DEFAULT 'pending',
  `notes`        TEXT,
  `created_at`   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  `updated_at`   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_status_scheduled`
  ON `reminders` (`status`, `scheduled_at`);
