# Saaf Signal — Frontend

**→ If you're deploying this (yourself, a developer, or an AI agent), read
[`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md) first.** It's the ordered,
step-by-step runbook covering both this repo and the backend repo together,
with a verification checklist and troubleshooting section. Everything below
is reference detail for this frontend specifically.

Static site, no build step. Four pages sharing `shared.css` and `shared.js`:

- `index.html` — public landing page
- `watchlist.html` — main dashboard
- `track-record.html` — the honesty ledger
- `chat.html` — plain-English chat interface

## Before deploying: point it at your backend

Open `config.js` and change one line:

```js
window.SAAF_CONFIG = {
  API_BASE: "https://your-backend-url.onrender.com",  // <- your deployed backend
};
```

Everything else reads from this automatically — you don't need to touch any
other file.

## Run locally

Just open `index.html` in a browser, or serve the folder so relative links
behave (recommended over `file://`):

```bash
python3 -m http.server 5500
# then visit http://localhost:5500
```

Make sure the backend is running too (see the backend repo's README) and
that `config.js` points at wherever it's running.

## Deploy — Vercel (recommended, free)

1. Push this folder to its own GitHub repo (e.g. `saaf-signal-frontend`).
2. On [vercel.com](https://vercel.com), **Add New → Project**, import the
   repo. No build command needed — it's static HTML. Framework preset:
   "Other". Output directory: leave as root.
3. Deploy. You'll get a URL like `https://saaf-signal-frontend.vercel.app`.
4. Go back to your **backend's** `FRONTEND_URL` env var and set it to this
   URL, so CORS is locked down instead of wide open.

## Deploy — Netlify (equally easy)

1. Push to GitHub.
2. On [netlify.com](https://netlify.com), **Add new site → Import an existing
   project**, connect the repo. Build command: none. Publish directory: `/`
   (repo root).
3. Deploy, then set the backend's `FRONTEND_URL` to the resulting URL.

## Deploy — GitHub Pages (free, simplest, slightly less flexible)

1. Push this folder to a GitHub repo.
2. Repo → Settings → Pages → Source: deploy from branch → `main` → `/ (root)`.
3. Your site is live at `https://yourusername.github.io/saaf-signal-frontend/`.
4. Set the backend's `FRONTEND_URL` to that URL.

Note: GitHub Pages serves everything over HTTPS. Your backend must also be
HTTPS (Render/Railway give you this by default) — a browser will block a
HTTPS page from calling an HTTP-only API ("mixed content").

## After deploying both halves

1. Backend live at, say, `https://saaf-signal-backend.onrender.com`
2. Frontend `config.js` → `API_BASE` set to that URL, redeployed
3. Backend's `FRONTEND_URL` env var set to your frontend's live URL, so CORS
   isn't left wide open to `*` forever
4. Visit your frontend URL, add a few tickers to the watchlist, confirm a
   real signal loads (this confirms the two halves are actually talking —
   something I couldn't verify end-to-end from the sandbox this was built
   in, since it can't reach Yahoo Finance's servers)

## Design system reference

If you want to extend these pages or build more:

- **Colors**: `--bg:#0B0D10` (near-black), `--bg-card:#15181D`, `--text:#EDEDEE`,
  `--hit:#3DDC84` (green, correct calls), `--miss:#FF5C5C` (red, wrong calls),
  `--neutral:#E8B84B` (amber, pending/coin-flip), `--watch:#5B9DF9` (blue,
  "worth watching" tier) — all defined in `shared.css` under `:root`.
- **Fonts**: Space Grotesk (headlines, UI text) + JetBrains Mono (all numbers,
  data, tickers — anything meant to read as "exact" rather than "editorial").
  Loaded via Google Fonts `<link>` in each page's `<head>`.
- **Voice**: plain, a little wry, never hypey. No rocket emojis, no urgency
  language, no inflated certainty. Wrong calls get the same visual weight as
  right ones everywhere in the UI — that's the whole point of the product.
