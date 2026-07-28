# WAYNE E SOLUTIONS

## WayneTrade — Developer's Build Guide

*Group Algo-Trading Command Center — TradingView + MetaTrader + Broker APIs*

Internal Team Use Only • Prepared for: Sant, Mandeep, Noor, Ritvik

---

## 1. Objective & Scope

WayneTrade is a group-first algo-trading command center. One strategy (from TradingView Pine Script or a custom model) drives execution across each friend's individual broker account — MetaTrader (forex/commodities/indices/crypto CFDs) and/or a SEBI-registered broker API (Indian equities/F&O). No pooled funds — every member keeps their own account and control. The product's job is to sit between signal generation and order execution as a risk, transparency, and compliance layer.

### What we are NOT building

- A new charting tool (TradingView already does this).
- A new TradingView-to-MetaTrader bridge from scratch (MetaApi / PineConnector-style tools already solve this reliably).
- A public signal marketplace or copy-trading SaaS for strangers.

### What we ARE building

- A risk + orchestration layer that sits above existing bridges/broker APIs.
- A plain-language dashboard so non-technical members understand their exposure.
- An audit trail that satisfies SEBI's Algo-ID / traceability requirements for the equities path.

## 2. System Architecture

Reuse the same architectural pattern as WayneRing / Waynur / PropertyPro: a Node/Express (or FastAPI) backend, Postgres (Neon) for persistence, a React/Vite frontend, and Railway/Vercel for deployment. This keeps onboarding low since the team already knows this stack.

| Layer | Responsibility | Suggested Tech |
| --- | --- | --- |
| Signal Source | Strategy logic fires buy/sell conditions | TradingView Pine Script (webhook alert) or a custom Python/Node strategy service |
| Ingestion API | Receives webhook, validates payload, authenticates source | Node/Express or FastAPI endpoint, HMAC-signed webhook secret |
| Risk Engine | Position sizing, max drawdown check, stop-loss/take-profit enforcement, kill-switch state | Custom service — the core IP of WayneTrade |
| Execution Bridge | Places the actual order on each member's account | MetaApi.cloud (MT4/MT5) for forex/crypto/commodities; Kite Connect (or similar) for Indian equities/F&O |
| Account/Group Manager | Maps one strategy to N member accounts, tracks linkage & permissions | Postgres schema — see Section 4 |
| Dashboard | Plain-language P&L, risk, kill-switch UI | React/Vite frontend (prototype in Lovable first, as with other products) |
| Audit/Compliance Log | Immutable record of every signal → decision → order, with Algo-ID tagging | Append-only Postgres table + optional S3/object storage export |
| Notifications | Trade alerts, risk warnings, kill-switch confirmations | WhatsApp Business API or Telegram bot (same pattern as HVAC Command Center's WhatsApp intake) |

**Flow:** TradingView (or custom model) → Ingestion API → Risk Engine (approve/reject/resize) → Execution Bridge → Member's own MetaTrader/broker account → Audit Log entry → Dashboard update → Notification.

## 3. Phased Build Plan

### Phase 1 (Weeks 1–8): MVP — Forex/Crypto via MetaTrader

- Set up MetaApi.cloud account and connect one demo MT5 account per test member.
- Build the TradingView webhook receiver (Node/Express) with signature verification.
- Build a minimal Risk Engine: fixed position sizing + hard stop-loss + a manual kill-switch (no auto-optimization yet).
- Wire Risk Engine output to MetaApi order placement for 2–3 demo accounts.
- Basic logging table: every signal, decision, and order recorded with timestamps.
- Goal: one strategy, running live on paper/demo accounts across 2–3 friends, with a kill-switch that works.

### Phase 2 (Weeks 8–16): Risk Layer + Dashboard

- Build the plain-language dashboard (React/Vite): today's risk exposure, open positions in simple terms, P&L in currency not just %, one-click pause per member.
- Add configurable risk rules per member (different position sizes / risk tolerance per person, same strategy).
- Add a lightweight backtesting module (Python — vectorbt or backtrader) so strategies are validated before going live.
- Move from demo to small real-capital pilot with 1 friend group.

### Phase 3 (Weeks 16–24): Equities Compliance Path

- Integrate a SEBI-registered broker API (e.g., Kite Connect) for Indian equities/F&O.
- Implement Algo-ID tagging on every order per SEBI's 2026 framework — confirm the exact registration process with the chosen broker before going live on this path.
- Extend the audit trail to be export-ready for regulatory review.
- Legal/compliance review before any real equities trading goes live — do not skip this step.

### Phase 4 (Weeks 24–36): Multi-Group Scale

- Group onboarding flow (invite friends, link their own broker accounts, set individual risk limits).
- Billing/subscription layer (reuse Razorpay/Stripe integration pattern from PropertyPro).
- Prepare white-label groundwork if opening this to other small trading communities.

## 4. Core Data Model (starting point)

| Table | Key Fields | Notes |
| --- | --- | --- |
| groups | id, name, admin_user_id, created_at | One friend-group / trading circle |
| members | id, group_id, user_id, broker_type, broker_account_ref, risk_profile_id, status | broker_account_ref should store only a tokenized reference, never raw credentials in plaintext |
| strategies | id, group_id, name, source_type (pine_script/custom), webhook_secret_hash | One strategy can serve one group |
| signals | id, strategy_id, raw_payload, received_at, validated (bool) | Immutable log of every incoming signal |
| risk_decisions | id, signal_id, member_id, action (approve/reject/resize), reason, position_size | Core audit record — why did the risk engine do what it did |
| orders | id, risk_decision_id, member_id, broker_order_ref, status, algo_id (nullable, equities only) | One row per order actually sent to a broker |
| kill_switch_events | id, member_id or group_id, triggered_by, triggered_at, reason | Every pause/stop must be logged, no silent kill-switches |

**Security note:** broker credentials/API keys must be stored encrypted (e.g., via a secrets manager or encrypted columns), never committed to any repo, and never logged in plaintext anywhere — including in the audit trail above.

## 5. Suggested Team Split

| Person | Focus Area |
| --- | --- |
| Sant | Backend: ingestion API, risk engine, MetaApi/Kite Connect integration, audit logging |
| Mandeep | Frontend dashboard (React/Vite), member onboarding flow |
| Noor | UI/UX design for the plain-language dashboard, brand system for WayneTrade |
| Ritvik | QA — test signal → order flow end-to-end on demo accounts, backtesting scripts |

## 6. Open Questions & Risks to Resolve Before Building

- Which broker(s) will Phase 1 demo/pilot use for MetaTrader — confirm API/webhook support and cost.
- Legal structure: is WayneTrade a tool the group licenses, or does Wayne E Solutions have any advisory/signal-provider liability? Get this reviewed before real money is involved.
- Confirm SEBI Algo-ID registration process directly with the chosen broker before starting Phase 3 — requirements may change and should not be assumed from this document.
- Decide whether strategies are Pine-Script-only (simpler, faster) or need custom Python/Node models (more flexible, more build time) for the MVP.
- Data residency / compliance for storing financial data — confirm before enabling real equities trading.

## 7. Reference Starting Points

- MetaApi.cloud docs — MT4/MT5 REST & WebSocket API for order execution and account management.
- TradingView Pine Script webhook alerts documentation.
- Kite Connect (Zerodha) API docs — for the Indian equities/F&O execution path.
- SEBI's 2026 algo trading framework circulars — for Algo-ID and audit trail requirements (verify latest version before implementation).

---

*This document is a build-planning reference, not a final spec — confirm broker-specific and regulatory details directly with the respective provider before writing integration code against them.*
