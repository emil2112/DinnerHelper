# Phase 2 Revision — from composer to collaborator

Supersedes §3, §4 (Tonight screen) and §7 of `dinner-app-overhaul-brief.md`. Everything else
in the brief still stands. Phase 1 is unaffected.

---

## Why this changes

The composer was built to answer "what should we eat tonight" from zero. That isn't the
problem. The real problem, in the users' own words, is *finding inspiration on what to include
in these meals* — they usually already know two or three elements and are stuck on the last
one.

A reroll button is a slot machine: no agency, no reasoning, no way to say "not that, something
lighter." What they want is a collaborator that looks at the plate they're assembling and
suggests what would complete it.

**The plate is now user-built. The LLM's job is to look at it and suggest additions.**

---

## The new model

### Elements, not slots

- No fixed slot count. No role labels in the UI.
- One flat list of **elements** the user adds freely.
- Elements can be anything that goes on the table: "oven-roasted chicken breast", "potato
  wedges", "tomato salad", "lemon-dill dressing", "flatbread". Sauces and dressings are
  first-class — the old four-role template couldn't express them.
- Add, edit, remove, reorder. No minimum, no maximum.

### Roles persist in data, disappear from UI

Keep `role` on components. The suggestion engine needs to know the plate has no protein yet, or
that it's carb-heavy. Do not render role labels on the element cards.

`role` gains a value for elements that aren't protein/carb/veg:

```
protein | carb | veg | sauce | bread | other
```

### Adding an element — two paths

**Type it.** Free text with autocomplete against the component library.

> **Normalisation is load-bearing.** If the same dish enters as "potato wedges" one night and
> "roasted potatoes" the next, the cook log fragments and the Phase 4 feedback loop produces
> nothing. Autocomplete must match against `components.display_name` and aliases. When nothing
> matches, offer an explicit "add as a new component" path that captures the minimum fields
> (role, equipment, rough active time) and writes it to the library as `source='manual'`.
> Never silently store an unmatched free-text string as an element.

**Ask for a suggestion.** The primary inspiration action — see below.

---

## The suggestion panel

Triggered by "Suggest an addition", or by typing into the prompt bar.

**Always sends the whole plate as context.** Every element currently on it, with role,
equipment, serve temp, flavour and texture tags pulled from the library where matched.

Returns two groups, side by side:

| group | source | why |
|---|---|---|
| **From your library** | Ranked query over approved components | Instant, free, already endorsed by the user. Ranked using the old §3 scoring — contrast, texture variety, season, recency. |
| **Something new** | LLM (Job D below) | Inspiration beyond what they've already got. Each result has a one-tap "save to library". |

This replaces Phase 5's separate library-management chore. The library grows as a side effect
of normal use, which is the only way it will actually grow.

### The prompt bar

A persistent text field under the plate. The plate is always in context. The user can type
anything:

- "help me find another addition to this meal"
- "something lighter"
- "we want something acidic"
- "no more oven, it's full"
- "what's missing?"

"Suggest an addition" is just the default prompt, one tap. Free text is the escape hatch that
makes this a conversation rather than a button.

Keep a short exchange history within the session so follow-ups work: *"something lighter" →
"lighter than that"*. This is the chat feature the users liked, now anchored to a concrete
plate instead of a blank box.

---

## Live feasibility, not filtering

The §3 hard filters no longer generate anything. They now **check the plate as it's built** and
surface warnings inline. This is more useful than silent filtering, because the user sees the
constraint and decides.

| check | surfaced as |
|---|---|
| Oven components at incompatible temperatures | "Two things at 180 °C and 220 °C — one needs to move or wait" |
| More than `hob_capacity` concurrent hob elements | "Three pans at once" |
| Total active minutes over the energy cap | Time readout turns amber, not blocking |
| No cold or acidic element | Gentle hint: "everything here is hot — a cold element would balance it" |
| No protein / no carb | Gentle hint only. Never blocking. |

**All of these are advisory. Nothing is ever rejected.** If they want three roasted things,
that's their dinner.

Feasibility state also constrains suggestions: if the oven is full at 200 °C, the suggestion
panel should prefer no-cook and hob elements, and say why.

---

## Screen layout (mobile-first)

Keep the visual design already built — the dark cards, the energy toggle, the type. Only the
behaviour changes.

```
Tonight                                    [Low] [Normal] [Cook]

┌─────────────────────┐  ┌─────────────────────┐
│ oven-roasted        │  │ potato wedges       │
│ chicken breast      │  │ Oven · 200° · 10+30 │
│ Oven · 200° · 10+35 │  │              [edit] │
│              [edit] │  │                     │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ tomato salad        │      + Add element
│ No cook · 8 min     │  │                     │
│              [edit] │      type or suggest
└─────────────────────┘  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

⚠ Two oven elements at 200° — fine together.

33 active min                            [ Cook this ]

┌──────────────────────────────────────────────────┐
│ Ask for an addition, or tell me what you want…   │
└──────────────────────────────────────────────────┘
```

- Element cards lose the role label and the Lock/Reroll buttons. They gain edit and remove.
- The add card is a dashed placeholder, always last.
- Prompt bar pinned at the bottom on mobile.
- Empty state: plate with no elements, prompt bar reading "What are you starting with?" — and
  a suggestion of a starting point if asked. Degrades gracefully into the from-zero case
  without a slot machine.

---

## Job D — Plate completion (new prompt)

Add to `prompts-v2.md`. Uses the shared PROFILE block.

### System prompt

```
{PROFILE}

## YOUR TASK
The user is assembling a dinner plate from separate elements. You will be given the elements
already on the plate, and optionally a request in their own words.

Suggest additions that would complete or improve the plate.

## RULES
- Look at the plate as a whole. What is it missing — protein, a carbohydrate, a cold element,
  acidity, texture, colour?
- If everything on the plate is hot and cooked, a cold or acidic element is almost always the
  right answer. This is the single most reliable improvement to their plates.
- Respect the equipment state you are given. If the oven is full or at a fixed temperature,
  suggest hob or no-cook elements and say so briefly.
- Respect the time budget. If they have 10 minutes of hands-on time left, do not suggest
  something needing 25.
- Obey the dietary rules absolutely. Onion in any form is the most common failure — check
  yourself before answering.
- If the user has made a request in their own words, that request outranks your own read of
  the plate. "Something lighter" means lighter, even if you think it needs a carb.
- Be specific and confident. "Cucumber and dill salad with lemon" is useful. "A fresh salad"
  is not.
- Suggest 3 additions. Each genuinely different from the others — not three salads.
- Never suggest something already on the plate, or a near-duplicate of it.

## OUTPUT
Return ONLY a JSON array. No prose before or after.

[
  {
    "display_name": "cucumber and dill salad with lemon",
    "role": "veg",
    "equipment": "none",
    "active_min": 8,
    "passive_min": 0,
    "oven_temp_c": null,
    "serve_temp": "cold",
    "texture_tags": ["crunchy", "fresh"],
    "flavour_tags": ["acidic", "herbal"],
    "method_summary": "One sentence on how it's made.",
    "why": "One short sentence on what it adds to THIS plate specifically."
  }
]
```

The `why` field must reference the actual plate, not generic virtues. "Cuts through two rich
oven elements" is right. "Fresh and healthy" is not.

### User message template

```
Current plate:
{for each element: display_name | role | equipment | oven_temp_c | serve_temp | flavour_tags | active_min}

Oven state: {free | in use at N°C}
Hob elements in use: {n} of {hob_capacity}
Active minutes used: {n} of {cap} ({energy_level})
Current month: {month} (Denmark)

{user request, if any — otherwise: "No specific request. Suggest what would complete this plate."}

Recent meals (avoid repeating):
{last 10 logged meals, element names only}
```

---

## What to build

1. Data: add `sauce` / `bread` / `other` to the role enum. Add a `component_aliases` table, or
   an alias column, to support autocomplete normalisation.
2. Replace fixed slots with a variable element list in the Tonight state.
3. Autocomplete-backed add-element flow, with the "add as new component" path.
4. Suggestion panel: library ranking (reuse the composer's scoring) + Job D, side by side, with
   save-to-library on the new ones.
5. Prompt bar with session-scoped exchange history, plate always in context.
6. Feasibility checks as inline advisory warnings.
7. Remove Lock and Reroll.

## What to keep

- `composer.js` scoring — it becomes the library ranking function. Don't delete it.
- All hard filters — they become the advisory checks.
- The visual design, the energy toggle, the mobile-first layout.
- The existing chat, still reachable. It may become redundant once the prompt bar exists;
  decide that after using it, not now.

## What this does to later phases

- **Phase 3 (Method)** is unchanged and gets more valuable — interleaving an arbitrary set of
  user-chosen elements is exactly the hard part.
- **Phase 4 (Log and feedback)** depends entirely on normalisation working. If elements resolve
  to library components, logging and scoring work as designed. If they're loose strings, this
  phase produces nothing.
- **Phase 5 (Library management)** shrinks to a browser and editor. Expansion now happens
  through the suggestion panel during normal use.
