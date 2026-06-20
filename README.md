# DinnerHelper

A dinner suggestion app powered by Claude AI. Suggests recipe ideas based on your pantry staples and conversation history.

**Live site:** https://emil2112.github.io/DinnerHelper/

---

## Project structure

```
frontend/   React app (Vite)
worker/     Cloudflare Worker — API, auth, D1 database, Anthropic calls
migrations/ Cloudflare D1 SQL schema
.github/    GitHub Actions deploy workflow
```

---

## Local development

### Option 1 — UI only (no worker needed)

Good for working on layout, styling, or frontend logic. API calls will fail gracefully but the app is fully navigable.

```bash
git checkout dev
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The passphrase gate is automatically skipped on the `dev` branch.

### Option 2 — Full stack (frontend + worker)

Needed for testing chat, pantry, or anything that hits the API.

**Step 1 — Set up worker secrets**

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

Edit `worker/.dev.vars` and fill in your real `ANTHROPIC_API_KEY`. Leave `SKIP_AUTH=true` and `SHARED_PASSPHRASE=dev` as-is for local use.

**Step 2 — Run both servers** (two terminals)

```bash
# Terminal 1
cd worker
npm install
npm run dev        # starts local worker at http://localhost:8787

# Terminal 2
cd frontend
npm install
npm run dev        # starts frontend at http://localhost:5173
```

The frontend auto-connects to `localhost:8787` when no `VITE_WORKER_URL` is set.

---

## Branch strategy

| Branch | Passphrase gate | Deploys |
|--------|----------------|---------|
| `dev`  | Disabled (local dev) | No |
| `main` | Enabled | Yes — GitHub Pages |

Work on the `dev` branch. Merge to `main` when ready to ship. The gate is controlled by `frontend/.env.development` which Vite only loads during `npm run dev`, never during production builds.

---

## Deploying

**Frontend** — push to `main`. GitHub Actions builds and deploys to GitHub Pages automatically. The `VITE_WORKER_URL` secret is injected at build time from GitHub Actions secrets.

**Worker** — deploy manually from the `worker/` directory:

```bash
cd worker
npm run deploy     # runs: wrangler deploy
```

Worker secrets (set once via Wrangler, stored in Cloudflare):

```bash
wrangler secret put SHARED_PASSPHRASE
wrangler secret put ANTHROPIC_API_KEY
```

Never set `SKIP_AUTH` as a production secret.
