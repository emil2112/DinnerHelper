CREATE TABLE pantry_staples (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_recipes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  source_chat_id INTEGER,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id    INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
