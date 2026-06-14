-- D1 Schema for interview-me access control
-- Run this in Cloudflare D1 dashboard or via wrangler CLI

CREATE TABLE IF NOT EXISTS access_codes (
  code       TEXT PRIMARY KEY,
  label      TEXT,
  used_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS access_code_usage (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL,
  used_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (code) REFERENCES access_codes(code)
);

CREATE TABLE IF NOT EXISTS access_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  reason     TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
