-- docs/simplification.md: elements become free-text strings; the LLM is the only suggestion
-- source. component_aliases is dropped (autocomplete normalisation is now element_history +
-- plain components.display_name matching, no alias table needed). components/ingredients/
-- techniques are NOT dropped — they cost nothing left in place and seed autocomplete; the app
-- just stops reading anything from them but display_name.

DROP TABLE component_aliases;

CREATE TABLE element_history (
  text          TEXT PRIMARY KEY,
  times_used    INTEGER NOT NULL DEFAULT 0,
  last_used_at  TEXT
);
