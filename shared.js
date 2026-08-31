const API = (window.SAAF_CONFIG && window.SAAF_CONFIG.API_BASE) || "http://localhost:8000";

async function api(path, opts={}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(()=>({detail: res.statusText}));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

function tierClass(tier) {
  return {
    "High conviction": "high",
    "Worth watching": "watch",
    "Coin flip": "coin",
    "Speculative": "spec",
  }[tier] || "coin";
}

function highlightNav() {
  const path = window.location.pathname.split("/").pop() || "watchlist.html";
  document.querySelectorAll("nav.tabs a").forEach(a => {
    if (a.getAttribute("data-page") === path) a.classList.add("active");
  });
}

// Optional cross-link to a Saaf Trade investor view (see config.js) — a
// plain external link, not an integration. No-op if unconfigured.
function renderInvestorLink() {
  const url = window.SAAF_CONFIG && window.SAAF_CONFIG.SAAF_TRADE_INVESTOR_URL;
  if (!url) return;
  const nav = document.querySelector("nav.tabs");
  if (!nav) return;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = "Your Saaf Trade account ↗";
  nav.appendChild(a);
}
