-- Phase 2 revision (docs/phase-2-revision.md), "What to build" #1.
-- Widen role to include sauce/bread/other, and add component_aliases for autocomplete
-- normalisation. SQLite/D1 can't ALTER a CHECK constraint, so ingredients and components are
-- rebuilt. D1 enforces FKs even inside a migration transaction (PRAGMA foreign_keys=OFF is a
-- no-op there), so a plain create-copy-drop-rename sequence fails: dropping `ingredients`
-- while `components` still holds rows referencing it violates the constraint. Renaming both
-- old tables out of the way first (no rows are deleted, so nothing to violate), then creating
-- the new tables and copying in, then dropping the renamed old ones once nothing references
-- them, avoids that.

ALTER TABLE components RENAME TO components_old;
ALTER TABLE ingredients RENAME TO ingredients_old;

CREATE TABLE ingredients (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL CHECK (role IN ('protein', 'carb', 'veg', 'sauce', 'bread', 'other')),
  season_months  TEXT NOT NULL DEFAULT '[]',
  active         INTEGER NOT NULL DEFAULT 1
);
INSERT INTO ingredients (id, name, role, season_months, active)
  SELECT id, name, role, season_months, active FROM ingredients_old;

CREATE TABLE components (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id  INTEGER NOT NULL REFERENCES ingredients(id),
  technique_id   INTEGER NOT NULL REFERENCES techniques(id),
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('protein', 'carb', 'veg', 'sauce', 'bread', 'other')),
  equipment      TEXT NOT NULL CHECK (equipment IN ('oven', 'hob', 'none', 'grill')),
  active_min     INTEGER NOT NULL,
  passive_min    INTEGER NOT NULL DEFAULT 0,
  oven_temp_c    INTEGER,
  serve_temp     TEXT NOT NULL CHECK (serve_temp IN ('hot', 'room', 'cold')),
  texture_tags   TEXT NOT NULL DEFAULT '[]',
  flavour_tags   TEXT NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'approved', 'retired')),
  source         TEXT NOT NULL CHECK (source IN ('seeded', 'llm', 'manual')),
  times_cooked   INTEGER NOT NULL DEFAULT 0,
  last_cooked_at TEXT,
  rating_score   REAL,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ingredient_id, technique_id),
  CHECK (equipment != 'oven' OR oven_temp_c IS NOT NULL)
);
INSERT INTO components (
  id, ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min,
  oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source, times_cooked,
  last_cooked_at, rating_score, created_at
)
SELECT
  id, ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min,
  oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source, times_cooked,
  last_cooked_at, rating_score, created_at
FROM components_old;

DROP TABLE components_old;
DROP TABLE ingredients_old;

CREATE TABLE component_aliases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  component_id  INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  alias         TEXT NOT NULL
);
CREATE INDEX idx_component_aliases_alias ON component_aliases(alias);
CREATE INDEX idx_component_aliases_component ON component_aliases(component_id);
