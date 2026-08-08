-- Approved Job A additions from docs/seed-library-review-additions.md.
-- source='llm' (proposed by Job A, human-approved) as distinct from source='seeded' (0003).
-- Aubergine is intentionally serve_temp='room', not 'cold' — flagged during review as the
-- honest outcome for an ingredient with no real raw/cold preparation; it must NOT count toward
-- the composer's cold+acidic contrast rule in Phase 2.

INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw shaved asparagus salad with lemon', 'veg', 'none', 8, 0, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'asparagus' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred aubergine salad with lemon and herbs', 'veg', 'hob', 10, 15, NULL, 'room', '["soft"]', '["acidic","umami","herbal"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'aubergine' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw shredded broccoli and apple salad', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","sweet","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'broccoli' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled green beans', 'veg', 'none', 8, 15, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'green beans' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw massaged kale salad with lemon', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy","chewy"]', '["acidic","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'kale' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled leek ribbons', 'veg', 'none', 8, 15, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'leek' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw shaved mushroom salad with lemon', 'veg', 'none', 10, 0, NULL, 'cold', '["chewy"]', '["acidic","umami","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'mushroom' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'smashed raw pea salad with mint and lemon', 'veg', 'none', 8, 0, NULL, 'cold', '["soft","crunchy"]', '["acidic","sweet","fresh","herbal"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'peas' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw sugar snap pea salad with lemon and mint', 'veg', 'none', 8, 0, NULL, 'cold', '["crunchy"]', '["acidic","sweet","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'sugar snap peas' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw sweetcorn and herb salad', 'veg', 'none', 8, 0, NULL, 'cold', '["crunchy"]', '["acidic","sweet","fresh"]', 'approved', 'llm' FROM ingredients i, techniques t WHERE i.name = 'sweetcorn' AND t.name = 'raw';
