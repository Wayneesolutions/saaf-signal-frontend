// you need to touch to point the frontend at your live API.
// ---------------------------------------------------------------
window.SAAF_CONFIG = {
  // Local development (running backend with `uvicorn app.main:app --reload`):
API_BASE: "https://saaf-signal-backend.onrender.com",
  // Once deployed, replace the line above with your live backend URL, e.g.:
  // API_BASE: "https://saaf-signal-backend.onrender.com",

  // Optional. If this reader also has a Saaf Trade account (the
  // execution/risk-engine side — waynetrade-backend/waynetrade-frontend),
  // point this at their investor view so a nav link appears on every page
  // ("Your Saaf Trade account ↗", opens in a new tab). Leave blank/unset
  // and no link is added — this repo works standalone either way. This is
  // deliberately just a link, not an integration: the two products are
  // separate deployments with separate design systems, not one merged app.
  SAAF_TRADE_INVESTOR_URL: "",
};
