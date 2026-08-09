# Dinner Helper — Rebuild Spec

**This document replaces every other spec in `docs/`.** Deleting the old ones is part of
Stage 0. If you are reading this alongside `dinner-app-overhaul-brief.md`,
`phase-2-revision.md`, `simplification.md` or `prompts-v2.md`, those are obsolete and describe
products that were abandoned.

---

## 1. What the app is

A private dinner-inspiration tool for a couple in Denmark. They are confident cooks. They do
not need recipes managed, timelines planned, or decisions made for them. They need **ideas for
what else to put on the plate.**

Their dinners are assembled from separate elements — typically a protein, a carbohydrate and
one or two vegetables, sometimes a sauce or dressing. They usually know two or three of these
already. The gap is the last one or two.

### The flow, end to end

1. The user types elements of tonight's meal into boxes. Free text. Whatever they want.
2. The user writes a prompt — "what else should we add?", "something lighter", "we want
   something acidic".
3. The app sends the whole plate plus the prompt to the model.
4. The model reads the plate as a composition and answers.
5. The answer opens a normal chat. The user follows up. The plate stays pinned and current, and
   is re-sent with every message.

### The one idea that makes this work

The boxes are **structured context that doesn't scroll away.** That is the entire difference
between this app and opening a general chat assistant. The plate stays visible and current
while the conversation moves, so the model never loses track of what is actually being cooked,
and the user never re-types it.

Everything in this spec exists to serve that. Nothing else should be added to it.

---

## 2. Non-goals

These were built in a previous version and deliberately removed. Do not reintroduce them.

- **No component library as a constraint.** Element boxes are free text, always. Autocomplete
  never gates input.
- **No seeded data.** The app ships empty. Every element in it is one the user put there.
- **No roles, techniques, equipment, temperatures, tags, status or source** on elements. Two
  fields only — see §5.
- **No recipe links.** Models fabricate URLs. Recipes are written inline in the chat.
- **No method or timeline screen.** The user is a confident cook and does not want one.
- **No feasibility checking, oven-conflict detection or time budgeting in code.**
- **No JSON output from the model.** The chat returns prose. This removes an entire class of
  parse-failure bugs that affected the previous build.
- **No saved-plate feature.** Chat sessions are saved; plates are not separately reusable
  objects.

---

## 3. Stage 0 — teardown

Do this first, as its own commit. Nothing works after it. That is expected.

### Before deleting anything

1. Export remote D1 (`wrangler d1 export`) and keep the dump outside the repo.
2. Create a branch for the rebuild. Do not work on `main`.
3. **Report an inventory of every file you intend to delete, and stop for approval.** Do not
   delete before that approval.

### MUST SURVIVE — do not delete or modify

These are easy to lose in a teardown and expensive to reconstruct. Preserve each one exactly.

| what | where | why |
|---|---|---|
| **D1 binding** | `wrangler.jsonc` — binding name `DB` and its `database_id` | Configuration, not data. Maps `env.DB` in the worker to the actual database. Dropping tables does not touch it. If this is lost, the worker has no database and a new D1 instance has to be created and re-pointed for no reason. |
| **`ANTHROPIC_API_KEY` and `SHARED_PASSPHRASE`** | Cloudflare Worker secrets | Already set. Cannot be recreated from the repo. Never write either into a file. |
| **Auth implementation** | Worker + frontend | The shared-passphrase gate carries over unchanged. |
| **The PROFILE block** | Currently in `docs/prompts-v2.md` | See below. **Copy it out before deleting that file.** |
| **GitHub Actions deploy workflow** | `.github/workflows/` | Working frontend deploy. Leave alone. |
| **CSS, design tokens, dark theme, typography** | `frontend/src` styles | The user likes how the app looks. Components are being rebuilt; the aesthetic is not. |

> **On the PROFILE block specifically.** It is the most valuable text in this project — the
> distilled dietary rules and household description, refined across a long conversation and
> validated live (the model refused an explicit onion request unprompted, and phrased garlic
> correctly without being reminded). It is reproduced verbatim in §6 of this document, so it
> survives even if `prompts-v2.md` is deleted first. Use §6 as the source of truth.

### Delete

- All frontend source components and their routes. The chat feature, the Tonight screen, the
  suggestion panel, the add-element card, the method screen — all of it.
- All worker source modules for the previous design: `jobC.js`, `jobD.js`, the composer and
  feasibility remnants, and every route except auth.
- **All migrations** (`0001`–`0007`).
- **All tables** in local and remote D1: `ingredients`, `techniques`, `components`,
  `component_aliases`, `meals`, `meal_components`, `suggestions`, `profile`, `method_cache`,
  `element_history`, `pantry_staples`, `chats`, `messages`, and anything else present.
- `docs/dinner-app-overhaul-brief.md`, `docs/phase-2-revision.md`, `docs/simplification.md`,
  `docs/prompts-v2.md`.

Commit with a clear message. Then Stage 1.

---

## 4. Schema

One baseline migration, `0001_init.sql`. Four tables.

### `elements` — the user's library
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `name` | text, not null | "Tomato salad with cucumber and avocado" |
| `description` | text | "A simple tomato salad with cucumbers and avocado, with a little olive oil, salt and pepper." |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Two fields and it stays two fields.** Do not add equipment, prep time, role or tags, however
useful they might seem. The description carries all of that implicitly and in a form the model
reads better. This table starts empty and only ever contains entries the user chose to save.

### `sessions`
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `title` | text | first user prompt, truncated — for the history list |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `messages`
| column | type | notes |
|---|---|---|
| `id` | pk | |
| `session_id` | fk | |
| `role` | text | `user` \| `assistant` |
| `content` | text | |
| `plate` | text (JSON) | snapshot of the element boxes as sent with this message; null on assistant rows |
| `created_at` | timestamp | |

The plate is not stored as a separate concept. Every user message already carries the plate as
context, so storing the message as sent captures it for free — and captures it *as it was at
that moment*, which is what makes an old conversation readable later.

### `settings`
Single row. `pantry_staples` (JSON array of strings), plus room for future config.

Seed it with the user's existing ten staples, carried over from the D1 export: Balsamic
vinegar, Dried basil, Dried thyme, Garam masala, Garlic, Olive oil, Paprika, Rapeseed oil,
Sesame oil, Vinegar. Confirm against the export before hardcoding.

---

## 5. Screens

Mobile-first. Primary use is a phone in the kitchen; desktop secondary. Base CSS targets
mobile, media queries are the enhancement layer.

### Main screen

```
Dinner Helper

┌─────────────────────┐  ┌─────────────────────┐
│ oven-roasted        │  │ steamed jasmine     │
│ chicken breast      │  │ rice                │
│         [Save] [×]  │  │         [Save] [×]  │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ Type an element…    │      + Add element
└─────────────────────┘  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

┌──────────────────────────────────────────────────┐
│ What are you looking for?                        │
└──────────────────────────────────────────────────┘
                                          [ Ask ]

── conversation appears below, streaming ──

PANTRY STAPLES (10)                    [+ Add staple]
[Balsamic vinegar] [Dried basil] [Dried thyme] …
```

**Element boxes.** Plain text inputs. Type anything, press Enter, it becomes an element. No
autocomplete, no matching, no validation beyond non-empty. Click the text to edit in place.
`×` removes. `[Save]` adds it to the library (§5.3) and is hidden once saved.

**Unlimited boxes.** Add as many as wanted — proteins, carbs, vegetables, sauces, dressings,
bread. The app does not know or care what kind of thing each one is.

**At least one element is required** before the prompt can be submitted. The Ask button is
disabled with an empty plate.

**Effort toggle** (Low / Normal / Cook) sits top-right, as in the current design. It is injected
into the prompt as a plain sentence. One tap, no logic behind it.

**Pantry staples** stay at the bottom of this page, editable, as in the current app. They are
injected into the system prompt.

### Conversation

- Appears below the prompt bar, in the same view. Not a separate screen.
- **Streams.** A non-streaming chat feels broken.
- Rendered as markdown — the model will use bold, lists and inline recipes.
- Follow-ups continue the session. The plate and the full library are re-sent with every
  message, so mid-conversation edits to the boxes are picked up on the next turn.
- Sessions are listed in a sidebar (desktop) / menu (mobile), titled from the first prompt.

### Library page

- Lists all saved elements: name, description.
- Add manually. Edit either field. Delete.
- **`+ Add to tonight's plate`** on each row — puts it straight into a box on the main screen.
  This is a shortcut and must never become the only way in. Free text remains primary.
- Starts empty. No seeding, ever.

### Saving an element

When `[Save]` is tapped on a box:

1. Call the description helper (§6.2) with the element name and the recent conversation.
2. Show the generated description in an editable field, pre-filled.
3. User accepts or edits, then confirms.

One tap for a useful description, full control when wanted.

---

## 6. Prompts

The app has **one system prompt** plus one small helper. That is all.

### 6.1 Chat system prompt

Assembled server-side per request: the PROFILE block, then the library, then the task rules.

```
You are a dinner assistant for a couple in Denmark. They are assembling tonight's meal from
separate elements and want ideas for what else to put on the plate.

## HOUSEHOLD
A couple in Denmark. Two fit adults who prioritise health and variation. Every dinner contains
protein, carbohydrate and vegetables. Weeknight meals are simple, use easy-to-source
ingredients, and are cookable in 30–60 minutes with no advance prep.

## DIETARY RULES — ABSOLUTE, NO EXCEPTIONS

### Lactose
Fully lactose-free. No milk, cream, cheese or yoghurt unless explicitly lactose-free or
plant-based. Butter for pan-frying is fine. Oat cream, oat milk, coconut cream and
lactose-free cream are all fine.

### Onion and garlic (IBS)
- No onion in any form. This includes onion powder, dried onion, spring onion, shallot, and
  onion present in stock or seasoning blends.
- Garlic only as whole cloves added during cooking and removed before serving. No raw garlic,
  no garlic powder, no minced or crushed garlic left in the finished dish. Never phrase a
  suggestion in a way that implies garlic remains in the dish.

### Other IBS rules
- Nothing spicy.
- Nothing heavily fried or fatty.
- No artificial sweeteners (sorbitol, xylitol, mannitol).
- No carbonated drinks.

### Tomatoes
No warmed or cooked tomatoes, with one exception: a proper Italian-style pasta sauce where the
tomatoes have been cooked down thoroughly with other ingredients. No halved roasted tomatoes,
no cherry tomatoes blistered in a pan, no chunky tomato sauces. Fresh cold tomatoes in a salad
are fine.

## CARBOHYDRATES
A normal and expected part of dinner — never treated as optional or something to minimise.
Vary the source between meals: potato, pasta, rice, black rice, quinoa, couscous, bulgur,
bread. She eats somewhat fewer carbs than him, so portion guidance may differ.

## COOKING STYLE
Open to any protein. Willing to experiment. Simple, clean flavours. High protein, plenty of
vegetables, genuine variation between meals. Domestic hob and a single domestic oven.

## PANTRY STAPLES
Always available; assume access without asking. Background availability only — staples season,
finish, dress and deglaze. They never drive a dish.
{staples, comma-separated}

## THEIR SAVED ELEMENTS
Dishes they have made before and chosen to keep. Use these to understand their taste and what
they actually cook. Suggest one when it genuinely fits, and avoid suggesting something they
just had.
{for each: name — description}
{or: "Nothing saved yet."}

## YOUR TASK
Read the plate as a whole composition, not as separate items. Answer the user's question about
it.

- What is the plate missing — protein, a carbohydrate, a cold element, acidity, texture,
  colour?
- If everything on the plate is hot and cooked, a cold or acidic element is almost always the
  right answer. This is the single most reliable improvement to their plates.
- Never suggest something already on the plate, or a variation of it. If the plate has roasted
  chicken, do not suggest other chicken or another main protein unless asked.
- Infer equipment from how they described each element. "Oven-roasted" means the oven is busy;
  "pan-seared" means a hob ring is busy. Avoid suggesting something that needs equipment
  already in use, and say so briefly when that constrains you.
- The user's request outranks your own read of the plate. "Something lighter" means lighter,
  even if you think it needs a carb.
- Be specific and confident. "Cucumber and dill salad with lemon" is useful. "A fresh salad"
  is not.
- Offer 2–3 options unless asked for one. Each genuinely different — not three salads.
- Include how to make it: ingredients and short steps, inline. Never link to a recipe site —
  your URLs are unreliable. Write the recipe yourself.
- Say briefly why each suggestion fits THIS plate. "Cuts through two rich oven elements" is
  right. "Fresh and healthy" is not.

## TONE
Talk like a competent cook, not an assistant. No preamble, no "great question", no summarising
what they asked. Short paragraphs. This is a conversation — follow-ups are normal, and they may
push back or ask you to change direction.
```

### User message

```
Tonight's plate:
- {element}
- {element}

Effort tonight: {low: "we want something quick" | normal: "a normal weeknight" | cook: "we have time and want to cook"}

{user prompt}
```

Sent with every turn, including follow-ups, so plate edits mid-conversation are picked up.

### 6.2 Description helper

A single short call. Not a chat.

```
Write a one-sentence description of this dish, as the person who cooks it would describe it to
themselves. Mention the main ingredients and how it's prepared. Plain and factual — no
adjectives like "delicious" or "vibrant". Return only the sentence.

Dish: {name}
{recent conversation, if the element came from a suggestion}
```

### Model

Use `claude-sonnet-5` for both. Stream the chat call.

### Safety backstop

Keep a light server-side check on chat output for `/\bonions?\b/i`, and for `/\bgarlic\b/i`
without a nearby "removed". Do not block the response — log it. The prompt has proven reliable
in live testing; this exists only to detect drift.

---

## 7. Build stages

Each is a separate commit. Stop for approval at each boundary.

**Stage 0 — teardown.** §3. Inventory first, approval, then delete. Nothing works afterwards.

**Stage 1 — schema.** `0001_init.sql`. Four tables. Apply locally, verify, then remote.

**Stage 2 — backend.** Auth carried over. Routes: sessions CRUD, messages with streaming chat,
elements CRUD, settings. The system prompt assembled per §6. Verify with curl, including a
real streaming response.

**Stage 3 — frontend.** Main screen, conversation, library page, staples. Rebuilt on the
existing CSS and design tokens.

### Verification is done in the browser

`vite build` succeeding is **not** verification for this project. Every bug that reached the
user in the previous build was interaction behaviour a build cannot catch — most notably an
input that silently refused free text for three phases while every report said it worked.

Before reporting any frontend stage complete, use the Chrome extension to drive the actual UI
and check the console. At minimum, confirm by doing it:

- Typing arbitrary text into a box and pressing Enter creates that element, with no library
  entry matching it
- Ask is disabled with an empty plate and enabled with one element
- The response streams
- A follow-up question continues the same session
- Editing a box mid-conversation changes what the next answer refers to
- Saving an element pre-fills a description and it appears on the library page
- `+ Add to tonight's plate` from the library puts it in a box

---

## 8. The principle

If a behaviour can be handled by the model reading the plate, it should be — not by code
maintaining state about the plate. The previous build failed by duplicating the model's
judgement in code: roles, ranking, feasibility, equipment tracking. All of it was deleted, and
the model had been doing it better all along.

When in doubt, send more context to the model and write less code.
