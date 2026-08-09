# Dinner Helper

A dinner-inspiration chat for a household of confident cooks. You type the elements of tonight's
meal into boxes — a protein, a carb, a vegetable, whatever you've already decided — and ask the
model what else the plate needs. The plate stays pinned above the conversation and is re-sent
with every message, so follow-ups ("something lighter", "make it vegetarian") stay grounded in
what's actually on the table, not whatever was said three turns ago.

No recipe database, no suggestion engine, no structured metadata on what you type — elements are
free text, always. Two supporting pieces: a small library of elements you've chosen to save
(each with a one-tap AI-generated description), and pantry staples that get folded into every
prompt so the model knows what's always on hand without being told.

See `docs/dinner-helper-spec.md` for the full design rationale, including what this replaced and
why — an earlier version tried to model roles, techniques and feasibility in code, and the model
turned out to do all of it better from plain text.

**Live site:** https://emil2112.github.io/DinnerHelper/

---

## Project structure

```
frontend/   React app (Vite) — main screen, conversation, library, pantry staples
worker/     Cloudflare Worker — auth, streaming chat, D1 access, Anthropic calls
migrations/ Cloudflare D1 SQL schema (elements, sessions, messages, settings)
docs/       Design spec — the source of truth for what this app is and why
.github/    GitHub Actions deploy workflow
```

---

## Local development

**Step 1 — set up worker secrets**

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

Edit `worker/.dev.vars` and fill in a real `ANTHROPIC_API_KEY`. Leave `SKIP_AUTH=true` and
`SHARED_PASSPHRASE=dev` as-is for local use. Chat and the save-element description helper need a
real key to produce anything; sessions, elements and settings CRUD all work without one.

**Step 2 — run both servers** (two terminals)

```bash
# Terminal 1
cd worker
npm install
npm run dev        # local worker at http://localhost:8787

# Terminal 2
cd frontend
npm install
npm run dev        # frontend at http://localhost:5173
```

The frontend auto-connects to `localhost:8787` when no `VITE_WORKER_URL` is set, and skips the
passphrase gate locally via `frontend/.env.development` (Vite only loads this file for `npm run
dev`, never for a production build — the gate is always on in the deployed app).

---

## Deploying

**Frontend** — push to `main`. GitHub Actions builds and deploys to GitHub Pages automatically.
`VITE_WORKER_URL` is injected at build time from a GitHub Actions secret.

**Worker** — deploy manually from `worker/`:

```bash
cd worker
npm run deploy     # runs: wrangler deploy
```

Worker secrets (set once via Wrangler, stored in Cloudflare, never in the repo):

```bash
wrangler secret put SHARED_PASSPHRASE
wrangler secret put ANTHROPIC_API_KEY
```

Never set `SKIP_AUTH` as a production secret.
