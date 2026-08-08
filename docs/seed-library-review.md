# Seed library review

Human-readable view of `migrations/0003_seed_library.sql` — 70 components, all currently
`status = approved`, `source = seeded`. Nothing here has been applied to the remote database yet.
Come back with cuts/edits and we'll turn them into a follow-up migration before deploying.

---

## Distribution summary

### Components per ingredient (descending)

| count | ingredients |
|---|---|
| 4 | potato |
| 3 | cabbage, courgette, broccoli, carrot |
| 2 | chicken thigh, beef mince, salmon fillet, cod, quinoa, pasta, bulgur, cauliflower, mushroom, spinach, green beans, fennel, beetroot, leek, bell pepper, Brussels sprouts |
| 1 | chicken breast (bone-in), chicken breast (boneless), pork tenderloin, pork chop, steak, prawns, eggs, chickpeas, black beans, rice, black rice, bread, couscous, peas, cucumber, cherry tomato, kale, radish, sugar snap peas, sweetcorn, aubergine, asparagus |

70 components across 43 ingredients. 1 ingredient has 4 techniques, 4 have 3, 16 have 2.

### Ingredients with only one technique

**22 of 43** ingredients (all the `count = 1` row above): chicken breast (bone-in), chicken
breast (boneless), pork tenderloin, pork chop, steak, prawns, eggs, chickpeas, black beans, rice,
black rice, bread, couscous, peas, cucumber, cherry tomato, kale, radish, sugar snap peas,
sweetcorn, aubergine, asparagus.

### Ingredients with no cold or raw preparation

28 of 43 ingredients have every component served hot — no `raw`/`quick-pickle` technique, no
`serve_temp = cold` entry at all:

- **Protein (all 13):** chicken breast (bone-in), chicken thigh, chicken breast (boneless), pork
  tenderloin, pork chop, beef mince, steak, salmon fillet, cod, prawns, eggs, chickpeas, black
  beans. Expected by design — the seed doesn't give proteins a cold prep; the plate-level
  contrast rule only needs one cold/acidic component total, and that's carried entirely by veg
  (and a few carbs) below.
- **Carb (5 of 8):** potato, rice, black rice, bread, couscous.
- **Veg (10 of 22):** broccoli, mushroom, green beans, peas, leek, kale, sugar snap peas,
  sweetcorn, aubergine, asparagus.

---

## Protein (17)

### beef mince (2)
- **pan-fried beef mince with herbs** — pan-fry · hob · 15/0 min · hot · savoury, umami
- **oven-baked beef meatballs** — bake · oven · 15/20 min · hot · savoury, herbal

### black beans (1)
- **pan-fried black beans with herbs** — pan-fry · hob · 10/0 min · hot · savoury, herbal

### chicken breast (bone-in) (1)
- **oven-roasted bone-in chicken breast** — oven-roast · oven · 10/35 min · hot · savoury, herbal

### chicken breast (boneless) (1)
- **grilled chicken breast** — grill · grill · 12/5 min · hot · savoury, herbal

### chicken thigh (2)
- **pan-seared chicken thigh** — pan-sear · hob · 15/0 min · hot · savoury, umami
- **oven-roasted chicken thighs** — oven-roast · oven · 8/30 min · hot · savoury, umami

### chickpeas (1)
- **oven-roasted crispy chickpeas** — oven-roast · oven · 5/20 min · hot · savoury, nutty

### cod (2)
- **oven-baked cod fillet** — bake · oven · 5/15 min · hot · savoury, fresh
- **poached cod in broth** — poach · hob · 15/0 min · hot · savoury, fresh

### eggs (1)
- **soft-poached eggs** — poach · hob · 8/0 min · hot · savoury

### pork chop (1)
- **pan-seared pork chop** — pan-sear · hob · 15/5 min · hot · savoury, umami

### pork tenderloin (1)
- **oven-roasted pork tenderloin** — oven-roast · oven · 10/25 min · hot · savoury, herbal

### prawns (1)
- **pan-fried garlic prawns** — pan-fry · hob · 8/0 min · hot · savoury, umami

### salmon fillet (2)
- **oven-roasted salmon fillet** — oven-roast · oven · 5/15 min · hot · savoury, umami
- **pan-seared salmon fillet** — pan-sear · hob · 12/0 min · hot · savoury, umami

### steak (1)
- **pan-seared steak** — pan-sear · hob · 12/5 min · hot · savoury, umami

---

## Carb (14)

### black rice (1)
- **steamed black rice** — steam · hob · 5/30 min · hot · nutty

### bread (1)
- **warm crusty bread** — bake · oven · 2/8 min · hot · (none)

### bulgur (2)
- **steamed bulgur** — steam · hob · 5/15 min · hot · nutty
- **cold bulgur salad with lemon and herbs** — raw · none · 10/10 min · cold · acidic, fresh, herbal

### couscous (1)
- **fluffed couscous** — steam · hob · 5/5 min · hot · nutty

### pasta (2)
- **boiled pasta** — boil · hob · 10/0 min · hot · (none)
- **cold pasta salad with lemon and herbs** — raw · none · 15/0 min · cold · acidic, fresh, herbal

### potato (4)
- **oven-roasted potato wedges** — oven-roast · oven · 10/30 min · hot · savoury
- **simple boiled new potatoes** — boil · hob · 15/0 min · hot · savoury, fresh
- **creamy mashed potato** — mash · hob · 20/0 min · hot · savoury
- **oven-baked jacket potato** — bake · oven · 5/45 min · hot · savoury

### quinoa (2)
- **steamed quinoa** — steam · hob · 5/15 min · hot · nutty
- **cold quinoa salad with lemon and herbs** — raw · none · 10/0 min · cold · acidic, fresh, herbal

### rice (1)
- **steamed jasmine rice** — steam · hob · 5/15 min · hot · (none)

---

## Veg (39)

### asparagus (1)
- **grilled asparagus with lemon** — grill · grill · 8/0 min · hot · acidic, fresh

### aubergine (1)
- **oven-roasted aubergine** — oven-roast · oven · 8/25 min · hot · umami, savoury

### beetroot (2)
- **oven-roasted beetroot wedges** — oven-roast · oven · 8/40 min · hot · sweet, nutty
- **raw grated beetroot salad with lemon** — raw · none · 10/0 min · cold · acidic, fresh

### bell pepper (2)
- **oven-roasted bell pepper strips** — oven-roast · oven · 5/20 min · hot · sweet, savoury
- **raw bell pepper and herb salad** — raw · none · 8/0 min · cold · fresh, sweet

### broccoli (3)
- **steamed broccoli with lemon** — steam · hob · 8/0 min · hot · acidic, fresh
- **oven-roasted broccoli** — oven-roast · oven · 5/15 min · hot · savoury, nutty
- **charred broccoli** — char · hob · 10/0 min · hot · umami, nutty

### Brussels sprouts (2)
- **oven-roasted Brussels sprouts** — oven-roast · oven · 8/20 min · hot · savoury, nutty
- **raw shaved Brussels sprout salad with lemon** — raw · none · 10/0 min · cold · acidic, fresh

### cabbage (3)
- **raw cabbage and orange salad** — raw · none · 15/0 min · cold · acidic, sweet, fresh
- **braised cabbage with apple** — braise · oven · 10/25 min · hot · sweet, savoury
- **charred cabbage wedges with lemon and dill** — char · hob · 12/0 min · hot · acidic, herbal

### carrot (3)
- **raw carrot and orange salad** — raw · none · 10/0 min · cold · acidic, sweet, fresh
- **oven-roasted carrots with herbs** — oven-roast · oven · 5/25 min · hot · sweet, savoury
- **quick-pickled carrot ribbons** — quick-pickle · none · 10/15 min · cold · acidic

### cauliflower (2)
- **oven-roasted cauliflower steaks** — oven-roast · oven · 8/20 min · hot · nutty, savoury
- **quick-pickled cauliflower** — quick-pickle · none · 10/15 min · cold · acidic

### cherry tomato (1)
- **fresh cherry tomato and herb salad** — raw · none · 8/0 min · cold · acidic, fresh, herbal

### courgette (3)
- **oven-roasted courgette ribbons** — oven-roast · oven · 8/15 min · hot · savoury, herbal
- **shaved raw courgette salad with lemon** — raw · none · 10/0 min · cold · acidic, fresh
- **grilled courgette ribbons** — grill · grill · 8/0 min · hot · savoury, herbal

### cucumber (1)
- **quick-pickled cucumber salad** — quick-pickle · none · 10/15 min · cold · acidic, fresh

### fennel (2)
- **shaved raw fennel and orange salad** — raw · none · 10/0 min · cold · acidic, fresh
- **oven-braised fennel** — braise · oven · 8/25 min · hot · savoury, sweet

### green beans (2)
- **steamed green beans** — steam · hob · 8/0 min · hot · fresh
- **charred green beans** — char · hob · 10/0 min · hot · umami

### kale (1)
- **charred kale with lemon** — char · hob · 8/0 min · hot · acidic, umami

### leek (2)
- **pan-fried leeks** — pan-fry · hob · 10/0 min · hot · savoury
- **oven-braised leeks** — braise · oven · 8/20 min · hot · savoury, sweet

### mushroom (2)
- **pan-fried mushrooms with thyme** — pan-fry · hob · 10/0 min · hot · umami, savoury
- **oven-roasted mushrooms** — oven-roast · oven · 5/15 min · hot · umami

### peas (1)
- **quick-cooked peas with mint** — boil · hob · 5/0 min · hot · sweet, fresh, herbal

### radish (1)
- **quick-pickled radish** — quick-pickle · none · 8/15 min · cold · acidic, fresh

### spinach (2)
- **wilted spinach** — wilt · hob · 5/0 min · hot · fresh
- **raw spinach salad with citrus** — raw · none · 8/0 min · cold · acidic, fresh

### sugar snap peas (1)
- **pan-fried sugar snap peas** — pan-fry · hob · 6/0 min · hot · fresh, sweet

### sweetcorn (1)
- **charred sweetcorn** — char · hob · 8/0 min · hot · sweet

Total: 70 components (17 protein, 14 carb, 39 veg).
