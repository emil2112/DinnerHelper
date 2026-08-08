-- Phase 1 library seed (see docs/dinner-app-overhaul-brief.md §6).
-- Target ~60-80 approved components, veg-weighted. All entries below are inserted as
-- status='approved', source='seeded' — this file itself is the human-review artifact for the
-- initial seed (read it before applying), standing in for the per-item approve/bin queue that
-- Phase 5 builds for later LLM-proposed candidates.
--
-- Every component obeys the dietary rules in the `profile` row inserted by 0002: no onion, no
-- raw/powdered garlic (whole cooked cloves only), nothing spicy, no cooked tomato, lactose-free.
-- Each component is its own INSERT ... SELECT keyed by ingredient/technique name (no manual id
-- tracking, no VALUES-with-column-aliases, no UNION ALL chains — D1's local SQLite build
-- rejects the former and caps compound SELECTs at ~5 terms, so one statement per row is the
-- portable form here).

-- ============================= INGREDIENTS =============================

INSERT INTO ingredients (name, role, season_months) VALUES
  ('chicken breast (bone-in)', 'protein', '[]'),
  ('chicken thigh', 'protein', '[]'),
  ('chicken breast (boneless)', 'protein', '[]'),
  ('pork tenderloin', 'protein', '[]'),
  ('pork chop', 'protein', '[]'),
  ('beef mince', 'protein', '[]'),
  ('steak', 'protein', '[]'),
  ('salmon fillet', 'protein', '[]'),
  ('cod', 'protein', '[]'),
  ('prawns', 'protein', '[]'),
  ('eggs', 'protein', '[]'),
  ('chickpeas', 'protein', '[]'),
  ('black beans', 'protein', '[]'),

  ('potato', 'carb', '[]'),
  ('rice', 'carb', '[]'),
  ('black rice', 'carb', '[]'),
  ('quinoa', 'carb', '[]'),
  ('pasta', 'carb', '[]'),
  ('bread', 'carb', '[]'),
  ('couscous', 'carb', '[]'),
  ('bulgur', 'carb', '[]'),

  ('cabbage', 'veg', '[]'),
  ('courgette', 'veg', '[]'),
  ('broccoli', 'veg', '[]'),
  ('cauliflower', 'veg', '[]'),
  ('carrot', 'veg', '[]'),
  ('mushroom', 'veg', '[]'),
  ('spinach', 'veg', '[]'),
  ('green beans', 'veg', '[]'),
  ('peas', 'veg', '[]'),
  ('fennel', 'veg', '[]'),
  ('beetroot', 'veg', '[]'),
  ('cucumber', 'veg', '[]'),
  ('leek', 'veg', '[]'),
  ('cherry tomato', 'veg', '[6,7,8,9]'),
  ('bell pepper', 'veg', '[]'),
  ('kale', 'veg', '[]'),
  ('radish', 'veg', '[]'),
  ('sugar snap peas', 'veg', '[]'),
  ('sweetcorn', 'veg', '[]'),
  ('aubergine', 'veg', '[]'),
  ('Brussels sprouts', 'veg', '[]'),
  ('asparagus', 'veg', '[4,5,6]');

-- ============================= TECHNIQUES =============================

INSERT INTO techniques (name, equipment, default_active_min, default_passive_min) VALUES
  ('oven-roast',   'oven', 8, 20),
  ('braise',       'oven', 8, 25),
  ('bake',         'oven', 6, 15),
  ('pan-sear',     'hob',  12, 0),
  ('pan-fry',      'hob',  10, 0),
  ('char',         'hob',  10, 0),
  ('steam',        'hob',  6, 10),
  ('boil',         'hob',  10, 5),
  ('mash',         'hob',  15, 5),
  ('wilt',         'hob',  5, 0),
  ('poach',        'hob',  10, 5),
  ('grill',        'grill', 10, 0),
  ('raw',          'none', 10, 0),
  ('quick-pickle', 'none', 10, 15);

-- ============================= COMPONENTS: PROTEIN (17) =============================

INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted bone-in chicken breast', 'protein', 'oven', 10, 35, 200, 'hot', '["crisp"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'chicken breast (bone-in)' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-seared chicken thigh', 'protein', 'hob', 15, 0, NULL, 'hot', '["crisp","chewy"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'chicken thigh' AND t.name = 'pan-sear';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'grilled chicken breast', 'protein', 'grill', 12, 5, NULL, 'hot', '["chewy"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'chicken breast (boneless)' AND t.name = 'grill';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted chicken thighs', 'protein', 'oven', 8, 30, 200, 'hot', '["crisp"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'chicken thigh' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted pork tenderloin', 'protein', 'oven', 10, 25, 200, 'hot', '["chewy"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'pork tenderloin' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-seared pork chop', 'protein', 'hob', 15, 5, NULL, 'hot', '["chewy"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'pork chop' AND t.name = 'pan-sear';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried beef mince with herbs', 'protein', 'hob', 15, 0, NULL, 'hot', '["chewy"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'beef mince' AND t.name = 'pan-fry';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-baked beef meatballs', 'protein', 'oven', 15, 20, 200, 'hot', '["chewy"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'beef mince' AND t.name = 'bake';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-seared steak', 'protein', 'hob', 12, 5, NULL, 'hot', '["chewy"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'steak' AND t.name = 'pan-sear';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted salmon fillet', 'protein', 'oven', 5, 15, 180, 'hot', '["soft"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'salmon fillet' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-seared salmon fillet', 'protein', 'hob', 12, 0, NULL, 'hot', '["crisp","soft"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'salmon fillet' AND t.name = 'pan-sear';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-baked cod fillet', 'protein', 'oven', 5, 15, 180, 'hot', '["soft"]', '["savoury","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cod' AND t.name = 'bake';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'poached cod in broth', 'protein', 'hob', 15, 0, NULL, 'hot', '["soft"]', '["savoury","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cod' AND t.name = 'poach';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried garlic prawns', 'protein', 'hob', 8, 0, NULL, 'hot', '["chewy"]', '["savoury","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'prawns' AND t.name = 'pan-fry';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'soft-poached eggs', 'protein', 'hob', 8, 0, NULL, 'hot', '["soft","creamy"]', '["savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'eggs' AND t.name = 'poach';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted crispy chickpeas', 'protein', 'oven', 5, 20, 200, 'hot', '["crunchy"]', '["savoury","nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'chickpeas' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried black beans with herbs', 'protein', 'hob', 10, 0, NULL, 'hot', '["soft"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'black beans' AND t.name = 'pan-fry';

-- ============================= COMPONENTS: CARB (14) =============================

INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted potato wedges', 'carb', 'oven', 10, 30, 200, 'hot', '["crisp"]', '["savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'potato' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'simple boiled new potatoes', 'carb', 'hob', 15, 0, NULL, 'hot', '["soft"]', '["savoury","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'potato' AND t.name = 'boil';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'creamy mashed potato', 'carb', 'hob', 20, 0, NULL, 'hot', '["creamy","soft"]', '["savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'potato' AND t.name = 'mash';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-baked jacket potato', 'carb', 'oven', 5, 45, 200, 'hot', '["soft","crisp"]', '["savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'potato' AND t.name = 'bake';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed jasmine rice', 'carb', 'hob', 5, 15, NULL, 'hot', '["soft"]', '[]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'rice' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed black rice', 'carb', 'hob', 5, 30, NULL, 'hot', '["chewy"]', '["nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'black rice' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed quinoa', 'carb', 'hob', 5, 15, NULL, 'hot', '["soft"]', '["nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'quinoa' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'cold quinoa salad with lemon and herbs', 'carb', 'none', 10, 0, NULL, 'cold', '["soft"]', '["acidic","fresh","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'quinoa' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'boiled pasta', 'carb', 'hob', 10, 0, NULL, 'hot', '["chewy"]', '[]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'pasta' AND t.name = 'boil';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'cold pasta salad with lemon and herbs', 'carb', 'none', 15, 0, NULL, 'cold', '["chewy"]', '["acidic","fresh","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'pasta' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'warm crusty bread', 'carb', 'oven', 2, 8, 180, 'hot', '["crisp"]', '[]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'bread' AND t.name = 'bake';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'fluffed couscous', 'carb', 'hob', 5, 5, NULL, 'hot', '["soft"]', '["nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'couscous' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed bulgur', 'carb', 'hob', 5, 15, NULL, 'hot', '["chewy"]', '["nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'bulgur' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'cold bulgur salad with lemon and herbs', 'carb', 'none', 10, 10, NULL, 'cold', '["chewy"]', '["acidic","fresh","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'bulgur' AND t.name = 'raw';

-- ============================= COMPONENTS: VEG (39) =============================

INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw cabbage and orange salad', 'veg', 'none', 15, 0, NULL, 'cold', '["crunchy"]', '["acidic","sweet","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cabbage' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'braised cabbage with apple', 'veg', 'oven', 10, 25, 180, 'hot', '["soft"]', '["sweet","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cabbage' AND t.name = 'braise';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred cabbage wedges with lemon and dill', 'veg', 'hob', 12, 0, NULL, 'hot', '["crisp","soft"]', '["acidic","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cabbage' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted courgette ribbons', 'veg', 'oven', 8, 15, 200, 'hot', '["soft"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'courgette' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'shaved raw courgette salad with lemon', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'courgette' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'grilled courgette ribbons', 'veg', 'grill', 8, 0, NULL, 'hot', '["crisp"]', '["savoury","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'courgette' AND t.name = 'grill';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed broccoli with lemon', 'veg', 'hob', 8, 0, NULL, 'hot', '["soft"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'broccoli' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted broccoli', 'veg', 'oven', 5, 15, 200, 'hot', '["crisp"]', '["savoury","nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'broccoli' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred broccoli', 'veg', 'hob', 10, 0, NULL, 'hot', '["crisp"]', '["umami","nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'broccoli' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted cauliflower steaks', 'veg', 'oven', 8, 20, 200, 'hot', '["soft","crisp"]', '["nutty","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cauliflower' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled cauliflower', 'veg', 'none', 10, 15, NULL, 'cold', '["crunchy"]', '["acidic"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cauliflower' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw carrot and orange salad', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","sweet","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'carrot' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted carrots with herbs', 'veg', 'oven', 5, 25, 200, 'hot', '["soft"]', '["sweet","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'carrot' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled carrot ribbons', 'veg', 'none', 10, 15, NULL, 'cold', '["crunchy"]', '["acidic"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'carrot' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried mushrooms with thyme', 'veg', 'hob', 10, 0, NULL, 'hot', '["chewy"]', '["umami","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'mushroom' AND t.name = 'pan-fry';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted mushrooms', 'veg', 'oven', 5, 15, 200, 'hot', '["chewy"]', '["umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'mushroom' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'wilted spinach', 'veg', 'hob', 5, 0, NULL, 'hot', '["soft"]', '["fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'spinach' AND t.name = 'wilt';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw spinach salad with citrus', 'veg', 'none', 8, 0, NULL, 'cold', '["soft"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'spinach' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'steamed green beans', 'veg', 'hob', 8, 0, NULL, 'hot', '["crisp"]', '["fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'green beans' AND t.name = 'steam';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred green beans', 'veg', 'hob', 10, 0, NULL, 'hot', '["crisp"]', '["umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'green beans' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-cooked peas with mint', 'veg', 'hob', 5, 0, NULL, 'hot', '["soft"]', '["sweet","fresh","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'peas' AND t.name = 'boil';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'shaved raw fennel and orange salad', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'fennel' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-braised fennel', 'veg', 'oven', 8, 25, 190, 'hot', '["soft"]', '["savoury","sweet"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'fennel' AND t.name = 'braise';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted beetroot wedges', 'veg', 'oven', 8, 40, 200, 'hot', '["soft"]', '["sweet","nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'beetroot' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw grated beetroot salad with lemon', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'beetroot' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled cucumber salad', 'veg', 'none', 10, 15, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cucumber' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried leeks', 'veg', 'hob', 10, 0, NULL, 'hot', '["soft"]', '["savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'leek' AND t.name = 'pan-fry';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-braised leeks', 'veg', 'oven', 8, 20, 190, 'hot', '["soft"]', '["savoury","sweet"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'leek' AND t.name = 'braise';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'fresh cherry tomato and herb salad', 'veg', 'none', 8, 0, NULL, 'cold', '[]', '["acidic","fresh","herbal"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'cherry tomato' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted bell pepper strips', 'veg', 'oven', 5, 20, 200, 'hot', '["soft"]', '["sweet","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'bell pepper' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw bell pepper and herb salad', 'veg', 'none', 8, 0, NULL, 'cold', '["crunchy"]', '["fresh","sweet"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'bell pepper' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred kale with lemon', 'veg', 'hob', 8, 0, NULL, 'hot', '["crisp"]', '["acidic","umami"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'kale' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'quick-pickled radish', 'veg', 'none', 8, 15, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'radish' AND t.name = 'quick-pickle';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'pan-fried sugar snap peas', 'veg', 'hob', 6, 0, NULL, 'hot', '["crisp"]', '["fresh","sweet"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'sugar snap peas' AND t.name = 'pan-fry';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'charred sweetcorn', 'veg', 'hob', 8, 0, NULL, 'hot', '["crunchy"]', '["sweet"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'sweetcorn' AND t.name = 'char';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted aubergine', 'veg', 'oven', 8, 25, 200, 'hot', '["soft"]', '["umami","savoury"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'aubergine' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'oven-roasted Brussels sprouts', 'veg', 'oven', 8, 20, 200, 'hot', '["crisp"]', '["savoury","nutty"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'Brussels sprouts' AND t.name = 'oven-roast';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'raw shaved Brussels sprout salad with lemon', 'veg', 'none', 10, 0, NULL, 'cold', '["crunchy"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'Brussels sprouts' AND t.name = 'raw';
INSERT INTO components (ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min, oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source)
SELECT i.id, t.id, 'grilled asparagus with lemon', 'veg', 'grill', 8, 0, NULL, 'hot', '["crisp"]', '["acidic","fresh"]', 'approved', 'seeded' FROM ingredients i, techniques t WHERE i.name = 'asparagus' AND t.name = 'grill';
