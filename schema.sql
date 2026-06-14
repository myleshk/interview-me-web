-- D1 Schema for interview-me access control
-- Run this in Cloudflare D1 dashboard or via wrangler CLI

CREATE TABLE IF NOT EXISTS access_codes (
  code       TEXT PRIMARY KEY,
  label      TEXT,
  max_uses   INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS access_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  reason     TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
