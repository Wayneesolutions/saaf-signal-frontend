# START HERE — Deployment Runbook

This is the one file to hand to a developer (human or AI) if you want them to
deploy Saaf Signal without you supervising every step. It assumes they have
**two folders/repos**: `saaf-signal-backend` and `saaf-signal-frontend`. Each
also has its own README with platform-specific detail — this file is the
ordered checklist that ties them together.

Do the steps in this exact order. Step 2 depends on step 1's output; step 4
depends on step 2's output.

---

## Prerequisites

- A GitHub account, with these two folders pushed as two separate repos
  (`saaf-signal-backend`, `saaf-signal-frontend`)
- A free account on [Render](https://render.com) (backend hosting) and
  [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (frontend
  hosting) — or equivalents, see each README for alternatives
- Nothing else is required to get a working deployment. Optional extras
  (Anthropic API key for news signals, Twilio for WhatsApp) are called out
  below as skippable.

---

## Step 1 — Deploy the backend

1. Push `saaf-signal-backend/` to a GitHub repo.
2. On Render: **New → Blueprint** → connect that repo. Render reads
   `render.yaml` automatically — it will set up the Docker web service AND a
   persistent disk for the database without you configuring anything by hand.
3. Wait for the first deploy to finish (~2-5 min). Render gives you a URL
   like `https://saaf-signal-backend-xxxx.onrender.com`.
4. **Verify it actually works** before moving on:
   ```bash
   curl https://saaf-signal-backend-xxxx.onrender.com/
   ```
   Expected response:
   ```json
   {"status":"ok","disclaimer":"Educational forecast based on historical patterns only..."}
   ```
   If this fails, stop here and fix it — nothing downstream will work
   otherwise. Check Render's build/deploy logs first.

5. Also verify the data pipeline actually works (this is the one thing that
   could NOT be tested before deployment, since Yahoo Finance isn't reachable
   from a sandboxed build environment):
   ```bash
   curl -X POST https://saaf-signal-backend-xxxx.onrender.com/predict/RELIANCE.NS
   ```
   Expected: a JSON object with `technical_direction`, `technical_confidence`,
   `predicted_low`/`predicted_high`, etc. If this returns an error instead,
   see **Troubleshooting → yfinance fails** below.

**Write down the backend URL. You need it for step 2.**

---

## Step 2 — Point the frontend at the backend

1. In `saaf-signal-frontend/config.js`, change the one line:
   ```js
   window.SAAF_CONFIG = {
     API_BASE: "https://saaf-signal-backend-xxxx.onrender.com",  // <- from Step 1
   };
   ```
2. Commit and push this change.

---

## Step 3 — Deploy the frontend

1. Push `saaf-signal-frontend/` to a GitHub repo (if not already done).
2. On Vercel: **Add New → Project** → import the repo. Framework preset:
   "Other". No build command needed. Deploy.
3. You'll get a URL like `https://saaf-signal-frontend.vercel.app`.
4. Open it in a browser. You should see the landing page with a "Total calls
   tracked: 0" stat (honest — nothing's been logged yet) and no console
   errors. Open browser dev tools → Console to check for errors if the page
   looks broken or blank.

**Write down the frontend URL. You need it for step 4.**

---

## Step 4 — Lock down CORS

Right now the backend accepts requests from any website (`FRONTEND_URL=*`).
Fix that:

1. On Render: your backend service → **Environment** tab.
2. Set `FRONTEND_URL` to your Vercel/Netlify URL from Step 3
   (e.g. `https://saaf-signal-frontend.vercel.app` — no trailing slash).
3. Save — Render will redeploy automatically.
4. Re-test the frontend still works after this (reload the deployed
   frontend URL, confirm the watchlist/track-record pages still load data).
   If they break, double check the URL matches exactly, including `https://`.

---

## Step 5 — End-to-end verification checklist

Go through this on the **live, deployed** site (not localhost):

- [ ] Landing page loads, shows the marquee disclaimer and stat row
- [ ] `watchlist.html` → add a ticker (try `TCS.NS`) → a card appears with a
      real confidence %, price, and reliability tier (not an error)
- [ ] `chat.html` → ask "Should I care about RELIANCE.NS?" → get a plain-
      English answer with a "Why this number?" expandable section
- [ ] `track-record.html` → loads (will show "no calls logged yet" until
      you've run `POST /scan-watchlist` or `POST /predict/{ticker}` at least
      once — that's correct, expected behavior, not a bug)
- [ ] Browser console (F12 → Console) shows no red CORS errors on any page

If every box is checked, the deployment is done and correctly wired.

---

## Optional: nightly automation

Not required for the site to work, but needed for WhatsApp alerts and for
the track record to actually accumulate over time without you manually
calling the API. See `saaf-signal-backend/README.md` → "Nightly automation
once deployed" for exact cron/scheduler setup on Render or Railway.

## Optional: news/event layer

Requires an `ANTHROPIC_API_KEY` env var on the backend. Without it, the
`/predict/{ticker}/event` endpoint returns an error but everything else
(the core product) works fine. Skip this unless specifically wanted.

---

## Troubleshooting

**Frontend loads but every page shows "Request failed" or spinners forever**
→ Open browser dev tools → Network tab. If requests to your backend URL show
as failed/CORS errors, check: (a) `config.js` has the exact right backend
URL, no typo, (b) backend's `FRONTEND_URL` env var matches the frontend's
exact URL, (c) backend is actually running (`curl` it directly).

**"Mixed content" warning in console, requests blocked**
→ Your frontend is HTTPS (Vercel/Netlify/GitHub Pages always are) but your
backend URL in `config.js` starts with `http://` not `https://`. Render/
Railway give you HTTPS by default — make sure `config.js` uses `https://`.

**`/predict/{ticker}` or `/signal/{ticker}` returns a 502 or data-fetch error**
→ This calls Yahoo Finance via the `yfinance` library. Occasionally Yahoo
rate-limits or briefly blocks a hosting provider's IP range. Wait a few
minutes and retry. If it persists, check Render's logs for the exact error
— `yfinance` occasionally needs a version bump if Yahoo changes their API;
check for a newer version in `requirements.txt`.

**Track record resets / predictions disappear after a redeploy**
→ The persistent disk isn't mounted correctly. Confirm in Render's dashboard
that the service has a Disk attached at `/var/data`, and that `DATABASE_URL`
is set to `sqlite:////var/data/stockpredict.db` (four slashes — three for
the sqlite:// prefix, one for the absolute path root).

**Confidence numbers look weirdly high (90%+) on everything**
→ Check the `n_samples` value in the response. If it's low (under ~30), the
`reliability_tier` should say "Speculative" regardless of the confidence
number — if it doesn't, something's wrong in `app/main.py`'s
`reliability_tier()` function; it should never have been bypassed. This is
the core honesty mechanism — don't let anyone "simplify" it away.

---

## For a developer/AI extending this later: architecture rules to preserve

These aren't stylistic preferences — breaking them breaks the product's core
promise (see the backend README for the full explanation):

1. **Never wire a dashboard/UI directly to `POST /predict/*`.** Use
   `GET /signal/*` for anything that displays on page load. `/predict/*`
   permanently logs a call — only use it for deliberate, scheduled, or
   explicit "track this" actions.
2. **Never let the frontend or backend hide/filter out wrong predictions.**
   The Track Record page must always show misses with equal visual weight to
   hits. This is enforced by `outcomes.py`'s append-only design — don't add
   an edit/delete path for `Prediction` rows.
3. **Confidence scores must stay derived from `n_samples`-backed backtesting**
   (`app/forecast.py`). If anyone (including an AI making "improvements")
   proposes swapping in a black-box ML model that outputs a confidence score
   without a traceable sample count, that's a regression against the whole
   point of this product — flag it, don't just implement it.
