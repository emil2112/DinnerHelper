-- Rebuild baseline (docs/dinner-helper-spec.md §4). Four tables, nothing else.

CREATE TABLE elements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  plate      TEXT,   -- JSON array of element strings, as sent with this message; null on assistant rows
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  pantry_staples TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  updated_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed the singleton settings row with the household's actual staples, confirmed against the
-- D1 export at C:\Users\emil2\Projects\DinnerHelper-d1-backups\dinnerhelper-db-remote-export-2026-08-09.sql
-- (pantry_staples table, ids 1-10) rather than trusting the list written into the spec — they
-- turned out to match exactly, just in a different order.
INSERT INTO settings (id, pantry_staples)
VALUES (1, '["Sesame oil","Garlic","Olive oil","Rapeseed oil","Paprika","Dried basil","Dried thyme","Garam masala","Vinegar","Balsamic vinegar"]');
