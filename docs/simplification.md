# Simplification — free-text elements

Supersedes `phase-2-revision.md`. The core concept is unchanged and correct: the user fills in
boxes, the LLM looks at the whole plate and suggests additions. Everything below removes
machinery that was built to support that and is now getting in the way.

---

## Why

Live testing surfaced the problem. With chicken, rice and tomato salad on the plate, the
"From your library" column suggested *pan-seared chicken thigh* and *grilled chicken breast* —
two more proteins for a plate that already had one. The LLM column, given the same plate,
suggested wilted spinach and correctly reasoned about the tomato salad's acidity and the free
hob.

The code half needs roles, ranking weights, equipment metadata and a curated library to work at
all, and it still got it wrong. The LLM half needs a list of strings and got it right.

**So: elements become free text. The LLM is the only suggestion source.**

The user should never have to choose from a list to describe their own dinner.

---

## What an element is now

A string. That's the whole model.

```
"oven-roasted bone-in chicken breast"
"potato wedges"
"tomato salad"
"lemon-dill dressing"
```

No role. No equipment. No temperature. No active/passive minutes. No library membership, no
status, no approval.

The user types whatever they want. Autocomplete offers strings they've used before, and never
constrains — anything typed is accepted as-is.

---

## Remove

- The **"From your library"** column in the suggestion panel, and `rankLibraryCandidates`.
- **Role** from the UI and from all suggestion logic, including the role-gap bonus.
- **`checkFeasibility`** and `frontend/src/lib/feasibility.js` — the live oven/hob/time
  warnings. They depend on per-element metadata that no longer exists.
- The **total active minutes** readout on Tonight, for the same reason. It reappears on the
  Method screen, where Job C computes it.
- The **"add as new component"** form. Typing *is* adding.
- **`component_aliases`**, the `candidate`/`approved` status flow, and the `source` field's role
  in gating anything.
- **"Save to library"** on LLM suggestions. Tapping a suggestion adds it to the plate; if the
  meal gets cooked, the string is remembered automatically.

Do not drop the `components`, `ingredients` or `techniques` tables. They cost nothing to leave
in place and they seed autocomplete. Just stop reading anything but `display_name`.

---

## Add

### `element_history`

| column | type | notes |
|---|---|---|
| `text` | text, pk | the element string, trimmed, case-preserved |
| `times_used` | int | |
| `last_used_at` | timestamp | |

Written on **cook**, not on type — so abandoned drafts don't pollute it.

Autocomplete queries `element_history` first, ranked by `times_used` then recency, then falls
back to `components.display_name` as a starting corpus. Case-insensitive prefix and substring
match. Purely a suggestion; never blocks free input.

---

## Job D — rewritten

Replace the existing Job D in `prompts-v2.md`. Simpler input, same job.

### System prompt

```
{PROFILE}

## YOUR TASK
The user is assembling a dinner plate from separate elements, described in their own words.
You will be given the elements already on the plate, and optionally a request from the user.

Suggest additions that would complete or improve the plate.

## RULES
- Read the plate as a whole. What is missing — protein, a carbohydrate, a cold element,
  acidity, texture, colour?
- Never suggest something already on the plate, or a variation of it. If the plate has roasted
  chicken, do not suggest any other chicken, or any other main protein, unless the user asks.
- If everything on the plate is hot and cooked, a cold or acidic element is almost always the
  right answer. This is the most reliable single improvement to their plates.
- Infer equipment from how the user described each element. "Oven-roasted" means the oven is
  in use; "pan-seared" means a hob ring is busy. Avoid suggesting a third or fourth thing that
  needs the same equipment at the same time, and say so briefly when it constrains you.
- Obey the dietary rules absolutely. Onion is the most common failure — check yourself.
- GARLIC: only ever as whole cloves added during cooking and removed before serving. Never name
  a suggestion in a way that implies garlic remains in the dish. "Spinach with garlic" is
  WRONG. "Spinach wilted with a whole garlic clove, removed" is correct, and better still is a
  suggestion that simply doesn't need garlic.
- If the user has made a request in their own words, it outranks your own read of the plate.
  "Something lighter" means lighter, even if you think it needs a carb.
- Be specific and confident. "Cucumber and dill salad with lemon" is useful. "A fresh salad"
  is not.
- Suggest 3 additions, each genuinely different from the others — not three salads.

## OUTPUT
Return ONLY a JSON array. No prose before or after.

[
  {
    "text": "cucumber and dill salad with lemon",
    "why": "One short sentence on what it adds to THIS plate specifically."
  }
]

"text" is what will appear in the user's plate box — write it the way they would.
"why" must reference the actual plate. "Cuts through two rich oven elements" is right.
"Fresh and healthy" is not.
```

### User message

```
Current plate:
- {element text}
- {element text}

Effort level: {low | normal | cook}
Current month: {month} (Denmark)

{user request, or: "No specific request. Suggest what would complete this plate."}

Recently cooked (avoid repeating):
{element strings from the last 10 logged meals}
```

### Server-side backstop

Before returning suggestions, reject or regenerate any whose `text` matches `/\bonions?\b/i`,
or matches `/\bgarlic\b/i` without also matching `/removed?\b/i`. Log rejections so we can see
how often it happens.

---

## Job C — input change

Job C no longer receives structured metadata, because there isn't any. It receives the same
element strings the user typed and infers equipment, temperature and timing from them.

Update its user message to:

```
Servings: {n}

Elements:
- {element text}
- {element text}

Effort level: {low | normal | cook}
```

Add to its system prompt:

```
You are given elements as the user described them, without structured metadata. Infer
equipment, oven temperature and timing from the description. "Oven-roasted potato wedges"
means the oven at roughly 200 °C for around 40 minutes. Where two elements need the oven,
choose one temperature that works for both and adjust timings accordingly. State the
temperature you have chosen in the first step.
```

Cache key becomes a hash of the sorted, lowercased, trimmed element strings plus servings.

---

## Tonight screen after this change

```
Tonight                                    [Low] [Normal] [Cook]

┌─────────────────────┐  ┌─────────────────────┐
│ oven-roasted        │  │ steamed jasmine     │
│ chicken breast      │  │ rice                │
│            [Remove] │  │            [Remove] │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ tomato salad        │   Type an element…
│            [Remove] │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
└─────────────────────┘

        [ Suggest an addition ]    [ Cook this ]

┌──────────────────────────────────────────────────┐
│ SUGGESTIONS                                      │
│ cucumber and dill salad with lemon        [+ Add]│
│ Cuts through two rich oven elements.             │
│                                                  │
│ charred broccoli with lemon               [+ Add]│
│ Adds a bitter, crisp edge…                       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Ask for an addition, or tell me what you want…   │
└──────────────────────────────────────────────────┘
```

Cards show the text and a Remove button. Nothing else. Tapping the text makes it editable
in place — with free text, edit is now trivial and worth having.

Suggestions are a single list, full width. `[+ Add]` puts the text straight into a new box.

---

## Effect on Phase 4

Unchanged in shape, simpler in implementation. A meal is a timestamp, a verdict, and a list of
element strings. `element_history` updates on cook. "Recently cooked" flows into Job D so it
stops repeating itself.

The per-component ratings and `times_cooked` scoring from the original brief are gone with the
library. If a verdict-weighted preference signal turns out to be wanted later, it can be
reintroduced as a string-level count — but don't build it until it's asked for.

---

## The principle going forward

If a behaviour can be handled by the model reading the plate, it should be — not by code
maintaining state about the plate. The model is already reading everything; the code was
duplicating that badly. Every deletion above is an instance of the same mistake.
