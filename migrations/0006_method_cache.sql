-- Phase 3: Job C output, cached by plate signature (sorted component ids) + servings, so a
-- repeated plate/servings combination is free (brief §4/§7). Servings is part of the key
-- because quantities scale with it — the same set of elements at 2 vs 4 servings is a different
-- cached result.
CREATE TABLE method_cache (
  plate_signature  TEXT NOT NULL,
  servings         INTEGER NOT NULL,
  payload          TEXT NOT NULL,   -- JSON: {servings, total_active_min, total_elapsed_min, components, timeline, notes}
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (plate_signature, servings)
);
