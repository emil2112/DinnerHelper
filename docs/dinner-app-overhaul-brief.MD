# Dinner Ideas — Overhaul Brief

Hand this to Claude Code. It describes an **incremental** overhaul of an existing web app,
not a rewrite. The app must stay usable at every phase boundary.

---

## 0. Context you need first

**What the app is.** A private dinner-suggestion web app used by a couple in Denmark. It
currently has a chat interface: a text box, a chat history sidebar, and an editable list of
pantry staples. It calls an LLM with a system prompt and returns free-text dish suggestions.

**Why it's being changed.** It stopped being used. Two reasons: suggestions felt generic, and
the output wasn't directly actionable. The root cause is architectural, not cosmetic — the app
holds no persistent state about what these people cook, so every request starts cold and the
model returns average answers. The chat interface also makes the user do the hardest part
(articulating what they want) before it will help.

**The reframe.** These users don't cook *dishes*. They assemble *plates* from components by
role:

- 1 protein
- 1 carb
- 2 vegetables

Each component is an **ingredient × technique** pair — "oven-roasted potato wedges", "cabbage
and orange salad", "pan-seared salmon". A real example plate:

> Oven-roasted bone-in chicken breast · oven-roasted potato wedges · simple stir fry
> (courgette, mushroom, corn) · cabbage and orange salad

Their problem is not lack of ingredients. It's that each ingredient has calcified onto one
technique, so they rotate the same few plates. The fix is a **persistent component library**
plus a **composer** that assembles plates from it under feasibility and contrast rules.

**Key design principle.** The LLM moves *out* of the request path. Components are generated in
batches and human-approved ahead of time; composition is done in code and is therefore instant,
free and deterministic. The LLM is used for three narrow background jobs only (see
`prompts-v2.md`). Opening the app must be instant.

---

## 1. Phase 0 — inspect and report

Before writing any code, inspect the codebase and report back:

- Framework and language (frontend and backend)
- Database engine, current schema, and how migrations are run
- Where the system prompt lives and how staples are injected into it
- Which model API is called, from where (client or server), and how keys are held
- Existing auth/session model, if any — the app is used by two people
- Current mobile behaviour: is anything responsive today?

Stop after this and confirm the plan against what you find. The phases below assume a
conventional web stack with a server-side DB; adapt if reality differs.

---

## 2. Data model

New tables. Names are suggestions; match existing conventions.

### `ingredients`
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `name` | text | "potato", "cabbage", "chicken breast" |
| `role` | enum | `protein` \| `carb` \| `veg` |
| `season_months` | int[] | 1–12; empty means year-round |
| `active` | bool | soft-disable without deleting |

### `techniques`
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `name` | text | "oven-roast", "pan-sear", "raw salad", "quick-braise", "char" |
| `equipment` | enum | `oven` \| `hob` \| `none` \| `grill` |
| `default_active_min` | int | hands-on minutes |
| `default_passive_min` | int | unattended minutes |

### `components` — the core library unit
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `ingredient_id` | fk | |
| `technique_id` | fk | |
| `display_name` | text | "oven-roasted potato wedges" |
| `role` | enum | denormalised from ingredient; this is what the composer slots on |
| `equipment` | enum | usually from technique, overridable |
| `active_min` | int | |
| `passive_min` | int | |
| `oven_temp_c` | int null | **required if equipment = oven** — drives conflict detection |
| `serve_temp` | enum | `hot` \| `room` \| `cold` |
| `texture_tags` | text[] | crisp, soft, creamy, crunchy, chewy |
| `flavour_tags` | text[] | acidic, sweet, savoury, herbal, umami, fresh, nutty |
| `status` | enum | `candidate` \| `approved` \| `retired` |
| `source` | enum | `seeded` \| `llm` \| `manual` |
| `times_cooked` | int | denormalised counter |
| `last_cooked_at` | timestamp null | |
| `rating_score` | float null | rolling average from meal verdicts |

Unique constraint on `(ingredient_id, technique_id)`.

Only `status = approved` components are eligible for composition. LLM-generated components
land as `candidate` and require human approval — this is deliberate and is what keeps quality
high.

### `meals` — the cook log
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `cooked_at` | timestamp | |
| `verdict` | enum null | `again` \| `fine` \| `never` |
| `notes` | text null | |
| `photo_url` | text null | reserved for a later phase; add the column now |

### `meal_components`
Join table: `meal_id`, `component_id`, `slot_index`.

### `suggestions`
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `created_at` | timestamp | |
| `component_ids` | int[] | what was shown |
| `accepted` | bool | did they cook it |

Used for novelty avoidance — don't re-show the same plate days running.

### `profile`
Single-row config: dietary rules text, energy budgets, default servings, default role
template (`protein, carb, veg, veg`). Pantry staples move here from wherever they currently
live.

---

## 3. The composer (rules engine)

Pure server-side code. No LLM call. Input: energy level, locked component ids, current date.
Output: a set of components filling the role template, plus a rationale string.

### Hard filters — reject any plate violating these

1. **Dietary.** Enforced at the component level, so violations should never enter the library.
   Still assert at composition time as a safety net.
2. **Oven conflict.** All `equipment = oven` components must sit within 20 °C of each other,
   OR be sequenceable within the time budget. Two components needing 180 °C and 220 °C
   simultaneously is an invalid plate. *This rule alone eliminates most of the plates that
   look fine on paper and fail in a real kitchen.*
3. **Hob capacity.** Maximum 2 concurrent `equipment = hob` components.
4. **Time budget.** Sum of `active_min` ≤ the energy level's cap. Passive time overlaps and
   does not sum.
5. **Role coverage.** Exactly matches the template (default 1 protein, 1 carb, 2 veg).

### Soft scoring — rank the surviving candidates

| rule | weight | rationale |
|---|---|---|
| At least one `serve_temp = cold` **and** `acidic` component | **high** | This is what makes their plates work — three hot cooked elements against one cold, crunchy, acidic one. Encode it, don't hope for it. |
| At least one component with `passive_min > 20` | medium | The oven working while hands are free is what makes 4 components achievable on a weeknight. |
| Exactly one component with `times_cooked = 0` | medium | The "one new thing" rule — forced novelty at low risk. Never more than one per plate. |
| Recency penalty | high | Penalise components cooked in the last 14 days; scale by recency. |
| Suggestion recency penalty | medium | Penalise components shown in the last 5 suggestions, cooked or not. |
| Season match | medium | Bonus when the current month is in `season_months`. |
| Rating | medium | Weight by `rating_score`; heavily penalise `never` verdicts. |
| Texture variety | low | Penalise plates where 3+ components share a dominant texture. |

Return the top-scoring plate, with alternates held for reroll.

### Energy levels

| level | active cap | components | notes |
|---|---|---|---|
| Low | ~20 min | 3 | drop one veg; favour high-passive techniques |
| Normal | ~35 min | 4 | default |
| Cook | ~60 min | 4 | unlock higher-effort techniques |

### Reroll semantics

Rerolling a single slot re-runs composition with all other slots pinned. The rerolled slot
must not repeat what was just there. Rerolling must feel instant — precompute alternates.

---

## 4. Screens

**Mobile-first.** Primary use is a phone in the kitchen; desktop is secondary. Tap targets
large, method text readable at arm's length on a counter.

### Tonight (default route — replaces the chat box)
- Energy toggle at top: Low / Normal / Cook
- Four slot cards, **already populated on load** — zero input required to get value
- Each card: display name, ingredient, time, equipment icon, lock toggle, reroll button
- One-line rationale under the plate ("cold acidic salad against three hot elements; oven does
  most of the work")
- Total active time, prominent
- Primary CTA: **Cook this**
- Secondary, low-prominence: free-text box — the escape hatch for when they *do* have a
  craving. Keep the old chat path behind this; do not delete it.

### Method (after committing)
Not four stacked recipes. **One interleaved timeline**, relative offsets:

```
T+0    Oven to 200°. Potatoes cut, oiled, in.
T+15   Chicken in, same tray shelf above.
T+35   Courgette/mushroom/corn on the hob.
T+40   Cabbage + orange salad, dressed.
T+45   Chicken rests 5. Plate.
```

Plus per-component ingredient quantities for the configured servings. Generated by LLM job C
(see `prompts-v2.md`), cached against the plate so a repeat plate is free.

Footer: **We made it** → logs the meal, prompts for a one-tap verdict.

### Library
The inspiration surface.

- **Desktop:** full matrix. Ingredients as rows, techniques as columns, cells filled where a
  component exists. Empty cells are the inspiration, made visible.
- **Mobile:** matrix doesn't work at that width. Use an accordion list grouped by ingredient,
  with existing techniques as chips and a visible **+ suggest more** button per ingredient.
  Same information, different affordance.
- `+ suggest more` runs LLM job A, drops results in as `candidate`, and presents an
  approve/bin queue.
- Filters by role, season, status.

### Log
Reverse-chronological meals with components and verdicts. Replaces the chat-history sidebar.
Tapping a meal offers "cook this again", which loads it straight into Tonight.

### Settings
Profile layer: dietary rules, staples, servings, energy caps, role template. Rarely visited.

---

## 5. Build phases

Each phase ends with the app working. Do not proceed without confirmation.

**Phase 1 — foundation.** Migrations for all tables. Move staples and profile config into the
DB. Seed the library with roughly 60–80 approved components (see §6). No UI change yet beyond
Settings.

**Phase 2 — composer.** Rules engine, Tonight screen, lock/reroll. This is where the app
becomes useful. Old chat retained behind the escape hatch.

**Phase 3 — method.** LLM job C, timeline rendering, caching by plate signature.

**Phase 4 — log and feedback.** Meal logging, verdicts, wire `times_cooked` / `last_cooked_at`
/ `rating_score` back into scoring. *The app only starts improving over time once this exists.*

**Phase 5 — library management.** Matrix/accordion browser, LLM job A expansion, approval
queue.

**Phase 6 — conditional, not scheduled.** Photo logging: capture on the Method screen, vision
model identifies components, matches against the library, auto-logs the meal. Build this
**only if** manual logging proves to be the thing killing adoption. It is a solution to a
friction problem that may not materialise.

---

## 6. Seeding the library

Target ~60–80 approved components at launch, weighted toward vegetables — that's the slot
where the rut is worst and where inspiration is most needed.

| role | target count | notes |
|---|---|---|
| protein | ~15 | chicken (bone-in, breast, thigh), pork, beef mince, steak, salmon, white fish, prawns, eggs, legumes |
| carb | ~15 | potato (wedges, boiled, mashed, crushed), rice, black rice, quinoa, pasta, bread, couscous, bulgur |
| veg | ~35 | **the priority.** Multiple techniques per ingredient — cabbage raw/braised/charred, courgette, broccoli, cauliflower, carrot, mushroom, spinach, green beans, peas, fennel, beetroot, cucumber, leek |

Seed via LLM job A, but **the user reviews and approves every entry**. Do not auto-approve.
The approval step is what makes later suggestions feel personal rather than generated.

Ensure the seed set contains enough cold/acidic vegetable components to satisfy the contrast
rule — aim for at least 8.

---

## 7. Constraints and cautions

- **Do not put an LLM call in the Tonight page load.** Composition is code. The app must open
  instantly and cost nothing to browse.
- **Do not delete the chat path** in phase 2. It's the fallback while the composer earns trust.
- **`oven_temp_c` is not optional** for oven components. The conflict rule depends on it, and
  it's the difference between plates that work and plates that don't.
- **Never allow more than one unmade component per plate.** Two experiments in one dinner is a
  gamble; one is an adventure.
- **Two users, shared data.** The library and log are household-level, not per-user. Don't
  build per-user scoping unless auth already demands it.
- **Migration:** existing chat history has no structured value. Don't attempt to parse it into
  components. Archive it and move on.

---

## 8. Definition of done for the overhaul

The app is working if, on a Tuesday evening, one of them opens it on a phone, taps Low energy,
looks at four slots, rerolls one, taps Cook this, and starts cooking — in under 30 seconds,
without typing anything.
