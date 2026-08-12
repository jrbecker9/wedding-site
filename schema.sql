-- RSVP table for the early-interest list.
-- The API auto-creates this on first use; kept here for reference and for
-- manual runs: npx wrangler d1 execute cj-wedding-rsvps --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS rsvps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  attending  TEXT    NOT NULL,   -- 'yes' (wouldn't miss it) | 'no' (depends on the date)
  party      INTEGER NOT NULL,   -- 1..10
  song       TEXT,               -- optional dance-floor request
  email      TEXT                -- optional contact (API lazily ALTERs older tables)
);

-- Shared "boop the nose" counter for the Dogs page. Auto-created on first boop.
CREATE TABLE IF NOT EXISTS boops (
  dog   TEXT    PRIMARY KEY,     -- 'ella' | 'lily'
  count INTEGER NOT NULL
);

-- Email updates list (footer signup). Also auto-created by the API on first use.
-- email is UNIQUE so repeat signups are idempotent (INSERT OR IGNORE).
CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE
);
