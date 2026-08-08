-- Phase 1 foundation: component-library schema (see docs/dinner-app-overhaul-brief.md §2)
-- Adaptations for SQLite/D1: enums -> TEXT + CHECK, arrays -> TEXT holding a JSON array.

CREATE TABLE ingredients (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL CHECK (role IN ('protein', 'carb', 'veg')),
  season_months  TEXT NOT NULL DEFAULT '[]',   -- JSON array of ints 1-12; [] = year-round
  active         INTEGER NOT NULL DEFAULT 1     -- boolean
);

CREATE TABLE techniques (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT NOT NULL UNIQUE,
  equipment            TEXT NOT NULL CHECK (equipment IN ('oven', 'hob', 'none', 'grill')),
  default_active_min   INTEGER NOT NULL,
  default_passive_min  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE components (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id  INTEGER NOT NULL REFERENCES ingredients(id),
  technique_id   INTEGER NOT NULL REFERENCES techniques(id),
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('protein', 'carb', 'veg')),
  equipment      TEXT NOT NULL CHECK (equipment IN ('oven', 'hob', 'none', 'grill')),
  active_min     INTEGER NOT NULL,
  passive_min    INTEGER NOT NULL DEFAULT 0,
  oven_temp_c    INTEGER,
  serve_temp     TEXT NOT NULL CHECK (serve_temp IN ('hot', 'room', 'cold')),
  texture_tags   TEXT NOT NULL DEFAULT '[]',   -- JSON array, subset of crisp/soft/creamy/crunchy/chewy
  flavour_tags   TEXT NOT NULL DEFAULT '[]',   -- JSON array, subset of acidic/sweet/savoury/herbal/umami/fresh/nutty
  status         TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'approved', 'retired')),
  source         TEXT NOT NULL CHECK (source IN ('seeded', 'llm', 'manual')),
  times_cooked   INTEGER NOT NULL DEFAULT 0,
  last_cooked_at TEXT,
  rating_score   REAL,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ingredient_id, technique_id),
  CHECK (equipment != 'oven' OR oven_temp_c IS NOT NULL)
);

CREATE TABLE meals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cooked_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verdict    TEXT CHECK (verdict IN ('again', 'fine', 'never')),
  notes      TEXT,
  photo_url  TEXT
);

CREATE TABLE meal_components (
  meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES components(id),
  slot_index   INTEGER NOT NULL,
  PRIMARY KEY (meal_id, component_id)
);

CREATE TABLE suggestions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  component_ids  TEXT NOT NULL,   -- JSON array of component ids
  accepted       INTEGER NOT NULL DEFAULT 0
);

-- Single-row household config. dietary_rules/default_servings/default_role_template/staples
-- are exactly what the brief specifies for `profile`; oven_count/hob_capacity are added here
-- (not listed in the brief's table) so the composer's oven/hob capacity rules in Phase 2 read
-- household facts from data instead of hardcoding them, matching prompts-v2.md's stated
-- principle that this kind of setting should live in `profile` so it is editable without a
-- deploy. Flag if you'd rather these stay as code constants.
CREATE TABLE profile (
  id                     INTEGER PRIMARY KEY CHECK (id = 1),
  dietary_rules          TEXT NOT NULL DEFAULT '',
  energy_budgets         TEXT NOT NULL DEFAULT '{}',   -- JSON: {level: {active_cap_min, components}}
  default_servings       INTEGER NOT NULL DEFAULT 2,
  default_role_template  TEXT NOT NULL DEFAULT '[]',   -- JSON array of roles, one entry per slot
  staples                TEXT NOT NULL DEFAULT '[]',   -- JSON array of {category, name, notes}
  oven_count             INTEGER NOT NULL DEFAULT 1,
  hob_capacity           INTEGER NOT NULL DEFAULT 2,
  updated_at             TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed the singleton profile row. Dietary rules condensed from worker/system-prompt.md and
-- docs/prompts-v2.md's shared PROFILE block. Energy levels and role template from brief §3.
-- oven_count=1 and hob_capacity=4 come from this household's confirmed kitchen facts (Phase 0
-- follow-up). Staples are copied (not moved) from the existing pantry_staples table so the
-- live chat feature, which still reads pantry_staples directly, keeps working unmodified.
INSERT INTO profile (id, dietary_rules, energy_budgets, default_servings, default_role_template, staples, oven_count, hob_capacity)
SELECT
  1,
  'Fully lactose-free: no milk, cream, cheese or yoghurt unless explicitly lactose-free or plant-based; butter for pan-frying and oat/coconut/lactose-free cream are fine. No onion in any form (including onion powder, dried onion, spring onion, shallot, or onion in stock or seasoning blends). Garlic only as whole cloves added during cooking and removed before serving; no raw, powdered, minced or crushed garlic in the finished dish. Nothing spicy. Nothing heavily fried or fatty. No artificial sweeteners (sorbitol, xylitol, mannitol). No carbonated drinks. No warmed or cooked tomatoes, except a properly cooked-down Italian-style pasta sauce; fresh cold tomatoes in a salad are fine.',
  '{"low":{"active_cap_min":20,"components":3},"normal":{"active_cap_min":35,"components":4},"cook":{"active_cap_min":60,"components":4}}',
  2,
  '["protein","carb","veg","veg"]',
  COALESCE(
    (SELECT json_group_array(json_object('category', category, 'name', name, 'notes', notes)) FROM pantry_staples),
    '[]'
  ),
  1,
  4;
