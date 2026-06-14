# Dinner Assistant — Project Brief

A personal dinner suggestion web app for Emil and his girlfriend. A chat interface that calls the Anthropic API with a carefully tuned system prompt encoding their dietary rules (lactose intolerance, IBS-C, food preferences) so that every suggestion is actually usable.

This is a personal project for two users with shared data. It must be free to host long-term and only accessible to the two users.

---

## Goals

- Open the app on phone or desktop and type a prompt describing what's in the fridge, the mood, and the time budget.
- Get back one main dinner suggestion plus 1–2 alternatives that respect all dietary rules.
- The system prompt is the heart of the app — it must be easy to edit as preferences evolve.
- Only Emil and his girlfriend can access the app (shared passphrase).
- Be able to scale up later to store pantry staples, saved recipes, and chat history.

---

## Stack

| Layer       | Technology                                  | Notes                                  |
|-------------|---------------------------------------------|----------------------------------------|
| Frontend    | React + Vite                                | Hosted on GitHub Pages (free)          |
| Backend     | Cloudflare Worker                           | Free tier: 100k requests/day           |
| Database    | Cloudflare D1 (SQLite)                      | Free tier: 5GB, 5M reads/day           |
| LLM         | Anthropic API                               | Called from the Worker, never the browser |
| Deploy      | Wrangler (Worker) + GitHub Actions (frontend) | Manual deploy is also fine for MVP   |

All chosen for free-tier sustainability and clean integration within the Cloudflare ecosystem.

---

## Architecture

```
┌─────────────────────────┐
│  Phone / Browser        │
│  (React on GitHub Pages)│
└────────────┬────────────┘
             │  fetch() with auth header
             ▼
┌─────────────────────────┐
│  Cloudflare Worker      │
│  - Validates passphrase │
│  - Reads/writes D1      │
│  - Builds system prompt │
│  - Calls Anthropic API  │
│  - API key as secret    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Anthropic API          │
└─────────────────────────┘
```

The frontend never holds the Anthropic API key. The Worker is the trust boundary.

---

## Authentication

A single shared passphrase stored as a Worker secret (`SHARED_PASSPHRASE`).

- On first visit, the frontend prompts for the passphrase and stores it in `localStorage`.
- Every request to the Worker includes it as a header (e.g. `X-App-Auth: <passphrase>`).
- The Worker rejects any request without a matching passphrase with HTTP 401.

This is intentionally minimal — no user accounts, no registration, no JWT. For two users sharing all data, it's the right level of complexity.

---

## MVP Scope (Phase 1)

The first version should be shippable and useful with just these features:

1. **Passphrase gate** — single input on first visit, stored in `localStorage`.
2. **Chat interface** — text input + send button, message bubbles for user and assistant.
3. **System prompt loading** — Worker reads `system-prompt.md` at build time and uses it for every API call.
4. **Anthropic API call** — Worker forwards the user message + system prompt to Anthropic and returns the response.
5. **Display response** — render the assistant message cleanly (markdown-formatted, since the system prompt produces structured output).

That's it. No database use in Phase 1. The pantry placeholder in the system prompt can be left empty or hardcoded with a small starter list.

---

## Phase 2 (Later)

Once the core works, layer on the storage features:

- **Pantry staples** — a settings page to manage the list of staples (spices, oils, sauces, etc.). Stored in D1. Injected into the system prompt on every request.
- **Saved recipes** — a "save this" button on assistant messages. Saved recipes are browsable in a separate view.
- **Chat history** — all conversations are persisted in D1. Previous chats are browsable, and old chats can be reopened or continued.

Build these one at a time, in this order. Each should be a clean addition without rewriting the MVP.

---

## Data Model (D1)

For Phase 2, the schema is small and shared between both users (no `user_id` column needed since data is shared).

```sql
CREATE TABLE pantry_staples (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL,            -- 'spice', 'oil', 'sauce', 'vinegar', etc.
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_recipes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,            -- full markdown of the saved suggestion
  source_chat_id INTEGER,              -- optional FK to chat where it came from
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT,                     -- auto-generated from first message, editable
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id    INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,            -- 'user' or 'assistant'
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Keep migrations in a `/migrations` folder so the schema is versioned in Git.

---

## System Prompt

The system prompt lives in `worker/system-prompt.md` as plain markdown. The Worker imports it as a string via a Wrangler text module rule.

The placeholder `[INJECTED DYNAMICALLY FROM APP SETTINGS]` in the pantry staples section is replaced by the Worker at request time with the current pantry contents from D1 (or an empty list in Phase 1).

### Full system prompt content

```
You are a personal dinner assistant for Emil and his girlfriend, a couple based in Copenhagen.
Your job is to suggest dinner ideas and recipes that fit their lifestyle, tastes, and dietary needs.

## WHO THEY ARE
Emil and his girlfriend cook for two. They prioritise health and variation in their meals.
On weekdays they prefer meals that don't take too long. If Emil wants to invest extra time
in a more involved recipe, he will say so in his prompt — otherwise assume they want something
reasonably quick and straightforward.

## DIETARY RULES — ALWAYS APPLY, NO EXCEPTIONS

### Lactose
- Fully lactose-free. No milk, cream, butter, cheese, or yoghurt unless explicitly lactose-free
  or plant-based alternatives.
- Oat cream, oat milk, coconut cream, and lactose-free cream are all fine.

### IBS (his girlfriend has IBS-C)
Strictly avoid the following as ingredients:
- Raw garlic or onion in any form, including garlic powder and onion powder
- Whole garlic cloves used during cooking and removed before serving are fine
- Spicy food
- Heavily fried or fatty food
- Carbonated drinks
- Artificial sweeteners (sorbitol, xylitol, mannitol)

The following are potential IBS triggers they are still testing — use with caution and
mention when a recipe includes them: beans, lentils, chickpeas, cauliflower, mushrooms,
cabbage, Brussels sprouts.

### Tomatoes
- No warmed or cooked tomatoes unless it is a proper Italian-style pasta sauce where the
  tomatoes have been cooked down thoroughly together with the other ingredients.
- No halved roasted tomatoes, no cherry tomatoes heated in a pan, no chunky tomato-based sauces.
- Fresh cold tomatoes in salads are fine.

## CARBOHYDRATES
Carbohydrates are a normal part of their diet. Include a carb component in most meals — this
could be potato wedges, pasta, rice, quinoa, black rice, bread, or similar. Vary it meal to
meal. She eats somewhat fewer carbs than Emil, so portion guidance can reflect that, but do
not treat carbs as optional or something to avoid.

## THEIR COOKING STYLE
- They are open to any protein and any cooking method.
- They experiment with different salads, stir fries, and grains like quinoa and black rice.
- Simple, clean flavours with a focus on health and variation.
- High protein and plenty of vegetables are priorities.
- They use whole garlic cloves for flavour during cooking, removed before serving.

## PANTRY STAPLES
[INJECTED DYNAMICALLY FROM APP SETTINGS]

## HOW TO RESPOND
- Be friendly and practical. No long intros or disclaimers.
- Always lead with one main suggestion, followed by 1-2 alternatives.
- Structure each suggestion as: dish name, short description, ingredients list, steps,
  and any relevant serving notes.
- If something they mention conflicts with the dietary rules, flag it briefly and suggest
  a substitute. Don't silently remove it.
- If their prompt is vague, make confident suggestions rather than asking clarifying questions.
- If a recipe includes any of the caution ingredients (beans, mushrooms, cauliflower etc.),
  mention it as a reminder.
```

The prompt should live verbatim in `worker/system-prompt.md` so it can be edited as a plain markdown file without touching code.

---

## File Structure

```
dinner-assistant/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── PassphraseGate.jsx
│   │   ├── lib/
│   │   │   └── api.js              # wrapper for calls to the Worker
│   │   ├── styles/
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── worker/
│   ├── src/
│   │   ├── index.js                # Worker entry point
│   │   ├── auth.js                 # passphrase validation
│   │   ├── anthropic.js            # API call helpers
│   │   └── db.js                   # D1 helpers (Phase 2)
│   ├── system-prompt.md            # the system prompt, editable as plain text
│   ├── wrangler.toml               # Cloudflare config (with text module rule)
│   └── package.json
│
├── migrations/                      # D1 schema migrations (Phase 2)
│   └── 0001_initial.sql
│
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml     # auto-deploy to GitHub Pages
│
├── README.md
└── PROJECT_BRIEF.md                # this file
```

Keep the frontend and worker as separate npm packages (separate `package.json`). They have different dependencies and different deploy targets.

---

## Key Implementation Notes

### Loading the markdown into the Worker

Use a Wrangler text module rule in `wrangler.toml` so the markdown can be imported as a string:

```toml
[build]
command = ""

rules = [
  { type = "Text", globs = ["**/*.md"], fallthrough = true }
]
```

Then in the Worker:

```js
import systemPromptTemplate from './system-prompt.md';

const finalSystemPrompt = systemPromptTemplate.replace(
  '[INJECTED DYNAMICALLY FROM APP SETTINGS]',
  formatPantryStaples(pantryItems) // Phase 2; empty string for MVP
);
```

### Secrets

Two secrets need to be set on the Worker via `wrangler secret put`:

- `ANTHROPIC_API_KEY` — the actual Anthropic API key
- `SHARED_PASSPHRASE` — the passphrase Emil and his girlfriend use to access the app

Never put these in code, `.env` files committed to Git, or the frontend.

### CORS

The Worker needs CORS headers since the frontend (GitHub Pages domain) and the Worker (workers.dev domain or a custom domain) are on different origins.

Allow only the specific GitHub Pages domain, not `*`:

```js
const ALLOWED_ORIGIN = 'https://emil2112.github.io';
```

### Rate limiting

Cloudflare's built-in rate limiting in the dashboard is sufficient. Set it conservatively (e.g. 30 requests per minute per IP) as a defense-in-depth measure against the passphrase leaking.

### Anthropic API call

Recommended model: `claude-sonnet-4-6` for solid recipe quality. If cost ever becomes a concern, `claude-haiku-4-5-20251001` is a cheaper alternative that should still handle this task well.

Endpoint: `POST https://api.anthropic.com/v1/messages`

Minimal request shape:

```js
{
  model: 'claude-sonnet-4-6',
  max_tokens: 1500,
  system: finalSystemPrompt,
  messages: [
    { role: 'user', content: userMessage }
  ]
}
```

For Phase 2 (multi-turn conversations with history), pass the full message history from D1 in the `messages` array.

Streaming is a nice polish for later but not needed for the MVP.

---

## Out of Scope (Explicitly)

To keep the MVP tight:

- No user accounts beyond the shared passphrase.
- No image generation, voice input, or attachments.
- No mobile app — the React frontend should be mobile-responsive, that's enough.
- No analytics or telemetry.
- No internationalisation — English UI is fine.

---

## Development Order

A suggested build order for Claude Code:

1. Scaffold the repo structure (frontend + worker as separate packages).
2. Set up the Worker with passphrase validation and a hardcoded test endpoint.
3. Wire up the system prompt markdown loading.
4. Add the Anthropic API call and verify end-to-end with a curl request.
5. Build the React frontend: passphrase gate → chat interface.
6. Connect frontend to Worker.
7. Deploy: Worker via `wrangler deploy`, frontend via GitHub Pages.
8. (Phase 2) Add D1 migrations + pantry settings page.
9. (Phase 2) Add chat history and saved recipes.

Each step should be verifiable on its own before moving to the next.
