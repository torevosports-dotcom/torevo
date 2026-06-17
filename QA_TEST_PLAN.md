# Togo Sports Platform — End-to-End QA Test Plan

> Role: QA Lead walkthrough of the entire app. Grounded in actual code at `D:\TogoApp`.
> Legend: **P0** = launch blocker · **P1** = important · **P2** = polish ·
> Status: ⬜ not tested · ✅ pass · ❌ fail · ⚠️ partial

---

## 0. CRITICAL DEFECTS FOUND DURING REVIEW (fix before testing)

| ID | Severity | Area | Defect | Evidence |
|----|----------|------|--------|----------|
| DEF-001 | **P0** | Create Event | Insert uses **wrong DB column names**. Code writes `venue`, `event_date`, `location`, `city`, `organizer_name` but the `events` table columns are `venue_name`, `venue_address`, `date`, `time`, `state`, `skill_level`, `refund_policy`, `equipment_provided`. Publish will throw `column "venue" does not exist`. | `create-event.tsx` insert vs `mappers.ts:27-64` (real schema) |
| DEF-002 | **P0** | Create Event | No `skill_level`, `refund_policy`, `equipment_provided`, `event_type`, prizes, or rules captured/sent. NOT NULL columns may reject the row. | `mapEvent` reads these as non-optional |
| DEF-003 | **P0** | Auth | Login is bypassed with a fake local session. `user.id` = `u_<phone>` is NOT a real Supabase `auth.uid()`. Any insert (ticket, event) with `user_id = u_<phone>` will fail RLS / FK constraints against `profiles.id` / `auth.users`. | `login.tsx` handleSendOTP |
| DEF-004 | **P0** | Payments | `EXPO_PUBLIC_RAZORPAY_KEY_ID` empty → all UPI/card payments fail. Only wallet path works. | `.env` |
| DEF-005 | **P1** | Event Detail | Unknown event id silently shows `events[0]` instead of "not found". | `events/[id].tsx:42` |
| DEF-006 | **P1** | Data | On Supabase error, app silently falls back to mock events with no indication — user sees fake data. | `eventStore.ts` fetchEvents catch |
| DEF-007 | **P1** | Concurrency | Sold-out check is client-side only. Two users can book the last spot simultaneously (race). No DB `CHECK (current_participants <= max_participants)`. | `events/[id].tsx` isFull + RPC |

> **Root cause linking DEF-003:** Because login is faked, the *entire* write-path (create event, book ticket, wallet debit) cannot be truly end-to-end tested against Supabase until real auth (or a real seeded test user session) is restored.

---

## 1. AUTH & ONBOARDING

| ID | P | Scenario | Steps | Expected |
|----|---|----------|-------|----------|
| AUTH-01 | P0 | Login with valid 10-digit number | Enter `9876543210` → Get OTP | Lands on Home with a session (currently bypassed) |
| AUTH-02 | P1 | Reject short number | Enter `12345` → Get OTP | Button disabled / "Invalid Number" alert |
| AUTH-03 | P1 | Reject non-numeric | Type letters | Input strips to digits only, max 10 |
| AUTH-04 | P0 | OTP send + verify (when re-enabled) | Real number → receive SMS → enter code | Session created via `verifyOtp`, new vs returning routed correctly |
| AUTH-05 | P1 | New user → profile setup | First login | Routed to `/(auth)/setup`, must set name/username/city/sports |
| AUTH-06 | P1 | Returning user skips setup | Login with existing profile | Goes straight to Home |
| AUTH-07 | P1 | Username uniqueness | Setup with taken username | DB unique constraint error surfaced to user |
| AUTH-08 | P1 | Session persistence | Login → kill app → reopen | Still logged in (token restored) |
| AUTH-09 | P0 | Logout | Profile → Logout | Session cleared, routed to login, protected screens inaccessible |
| AUTH-10 | P2 | Deep link while logged out | Open `/events/x` unauthenticated | Redirected to login, then back after auth |

**Logic to implement/test:** real OTP provider (Twilio/MSG91), rate-limiting OTP requests, OTP expiry & resend cooldown, max-attempts lockout, profile setup validation, session refresh on token expiry.

---

## 2. HOME SCREEN

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| HOME-01 | P0 | Events load from DB | Hero + bento + lists populated from Supabase, not mocks |
| HOME-02 | P1 | Category chips filter | Tapping Cricket/Football filters the list |
| HOME-03 | P1 | "Trending/Filling Fast" logic | Correct events flagged by real fill % |
| HOME-04 | P1 | Sport tiles navigate | Tapping a sport tile → filtered discover/category |
| HOME-05 | P1 | Cover photos render | Each event shows correct sport cover image, no emoji |
| HOME-06 | P2 | Empty state | No events → graceful empty UI, not blank/crash |
| HOME-07 | P1 | Pull to refresh | Re-fetches events |
| HOME-08 | P2 | Horizontal scroll perf | Smooth on low-end device, no jank |
| HOME-09 | P1 | Location header | "Powai Sports Club, Mumbai" — real or static? Should reflect user city |

**Logic to implement/test:** trending algorithm (sort by fill rate/recency), location-based filtering, "near you" by user city, real-time participant counts.

---

## 3. DISCOVER / EVENTS SCREEN

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| DISC-01 | P0 | Full list from DB | All active events listed |
| DISC-02 | P0 | Search by text | Filters by title/venue |
| DISC-03 | P1 | Filter by category | Correct subset |
| DISC-04 | P1 | Filter by city | Correct subset |
| DISC-05 | P1 | Filter by price (free/paid) | Correct subset |
| DISC-06 | P1 | Combined filters | Search + category + city stack correctly |
| DISC-07 | P1 | Sold-out / ended events | Visually distinct or filtered out |
| DISC-08 | P2 | No results | "No events" empty state |
| DISC-09 | P1 | Tap card → detail | Opens correct event by id |

**Logic to implement/test:** sort options (date, price, prize), exclude past/cancelled events from default view, pagination/infinite scroll for scale.

---

## 4. EVENT DETAIL

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| EVD-01 | P0 | Correct event renders | All fields match DB row |
| EVD-02 | P0 | Cover photo hero | Sport cover image with overlay (no emoji) |
| EVD-03 | P1 | Prizes list | From `event_prizes` table |
| EVD-04 | P1 | Rules list | From `event_rules` table |
| EVD-05 | P1 | Spots-left math | `max - current`, accurate |
| EVD-06 | P0 | Sold-out blocks register | Button = "Sold Out", disabled |
| EVD-07 | P0 | **Deadline passed blocks register** | Button = "Registration Closed" (NEW FIX) |
| EVD-08 | P0 | Completed/cancelled blocks register | Button = "Event Ended"/"Cancelled" (NEW FIX) |
| EVD-09 | P1 | Organizer info | Name, rating, events hosted shown |
| EVD-10 | P1 | Escrow badge | Shows when `escrow_protected` |
| EVD-11 | P1 | Unknown id | Should show "not found" (currently DEF-005: shows event[0]) |
| EVD-12 | P1 | Share / map link | Venue tappable to maps (if implemented) |

---

## 5. REGISTRATION & PAYMENT (core revenue flow)

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| PAY-01 | P0 | Free event registration | Form → Confirm → **ticket written to DB** (NEW FIX), participant count +1, success screen |
| PAY-02 | P0 | Paid event via Wallet (sufficient) | Debit wallet, ticket created, count +1, transaction recorded |
| PAY-03 | P0 | Paid event via Wallet (insufficient) | "Insufficient Balance" alert, no debit, no ticket |
| PAY-04 | P0 | Paid via UPI | Razorpay flow → on success ticket created (blocked by DEF-004) |
| PAY-05 | P0 | Paid via Card | Razorpay flow → ticket (blocked by DEF-004) |
| PAY-06 | P1 | Payment cancelled mid-flow | No ticket, no debit, no count change |
| PAY-07 | P0 | Form validation | Name >1 char, phone >5 digits required |
| PAY-08 | P0 | Double-tap / double-submit | Only ONE ticket created (idempotency) |
| PAY-09 | P0 | Already registered | Block duplicate registration for same user+event |
| PAY-10 | P1 | Last spot race | Two users, one spot → only one succeeds (DEF-007) |
| PAY-11 | P1 | Wallet debit + ticket atomicity | If ticket insert fails after debit → refund/rollback |
| PAY-12 | P1 | Participant count rollback | Failed payment must not leave count incremented |
| PAY-13 | P1 | Team event registration | team_name captured, min/max players enforced |

**Logic to implement/test:** server-side payment verification (Razorpay signature), webhook to confirm payment before issuing ticket, atomic transaction (debit + ticket + count) via Postgres function, duplicate-registration unique constraint `(event_id, user_id)`, refund on failure.

---

## 6. CREATE EVENT (organizer flow)

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| CRE-01 | P0 | Sport selection (step 0) | One sport selectable, cover image shown |
| CRE-02 | P0 | Details validation (step 1) | title ≥3, venue ≥3 required |
| CRE-03 | P0 | Schedule validation (step 2) | date + time required, future date only |
| CRE-04 | P0 | **Publish writes to DB** | Row inserted with CORRECT columns (DEF-001/002 block this now) |
| CRE-05 | P0 | New event appears in list | After publish, shows on Home/Discover |
| CRE-06 | P1 | Fee/prize numeric | Non-numeric rejected, sane limits |
| CRE-07 | P1 | Date format | Parses `YYYY-MM-DD` + time correctly to ISO |
| CRE-08 | P1 | Escrow toggle persists | `escrow_protected` saved correctly |
| CRE-09 | P1 | Organizer = creator | `organizer_id` = real auth uid (blocked by DEF-003) |
| CRE-10 | P2 | Cancel mid-flow | No partial row saved |
| CRE-11 | P1 | Prizes & rules entry | Captured and written to child tables |
| CRE-12 | P1 | Max participants sane | >0, reasonable upper bound |

**Logic to implement/test:** match insert to real schema, add prizes/rules sub-forms, future-date validation, edit/delete own event, organizer-only permissions (RLS), image upload for custom cover.

---

## 7. TICKETS SCREEN

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| TIC-01 | P0 | Booked tickets show | All user's tickets from DB |
| TIC-02 | P0 | Ticket appears immediately after booking | Optimistic prepend |
| TIC-03 | P1 | Ticket details | Event, ticket #, amount, participant name |
| TIC-04 | P1 | Status tabs (upcoming/past) | Correct grouping by event date/status |
| TIC-05 | P1 | Empty state | No tickets → friendly empty UI |
| TIC-06 | P2 | QR / ticket number | Unique, displayable for entry |
| TIC-07 | P1 | Cancelled event reflects | Ticket shows cancelled/refund status |
| TIC-08 | P1 | Supabase failure | Graceful error, not silent empty (DEF: no fallback) |

**Logic to implement/test:** ticket cancellation + refund, past-event auto-move, check-in/QR validation.

---

## 8. PROFILE

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| PRO-01 | P0 | Real user fields | name, username, city, wallet from DB |
| PRO-02 | P0 | **Gamification is fake** | XP/level/win-rate/achievements hardcoded `mockPlayerProfile` — MUST become real |
| PRO-03 | P1 | events_participated/won | From DB, accurate |
| PRO-04 | P1 | Email shows | Currently always empty (`mapProfile` hardcodes '') |
| PRO-05 | P1 | Edit profile | Changes persist to DB |
| PRO-06 | P1 | Sports interests | Reflects setup choices |
| PRO-07 | P1 | Logout works | (see AUTH-09) |
| PRO-08 | P2 | Avatar upload | Image to Supabase Storage |

**Logic to implement/test:** `user_stats` table (XP, level, streak, form, win rate computed from ticket/result history), achievements engine, profile edit, avatar upload.

---

## 9. WALLET

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| WAL-01 | P0 | Balance from DB | Real `wallet_balance` |
| WAL-02 | P0 | Debit on payment | Balance reduces, `wallet_transactions` row added |
| WAL-03 | P0 | **Add Money** | Non-functional button — must wire Razorpay top-up |
| WAL-04 | P1 | **Withdraw** | Non-functional — must implement payout |
| WAL-05 | P1 | Transaction history | No screen exists — must build |
| WAL-06 | P1 | Concurrent debit | No double-spend (atomic balance update) |
| WAL-07 | P1 | Negative balance guard | Cannot go below 0 |

**Logic to implement/test:** add-money via gateway, withdraw/payout flow + KYC, transaction history screen, atomic balance updates, ledger reconciliation.

---

## 10. ESCROW (business differentiator)

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| ESC-01 | P0 | Funds held, not released | Entry fee held until event completion — **currently NOT implemented (UI label only)** |
| ESC-02 | P0 | Release to organizer on completion | After event ends successfully |
| ESC-03 | P0 | Refund to players on cancellation | Auto-refund if organizer cancels |
| ESC-04 | P1 | Dispute handling | Hold during dispute |
| ESC-05 | P1 | Escrow ledger | Separate holding account tracked |

**Logic to implement/test:** entire escrow engine — holding account, release/refund triggers tied to event lifecycle, dispute state machine. This is currently cosmetic.

---

## 11. EVENT LIFECYCLE / SCHEDULING (currently missing)

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| LIF-01 | P0 | upcoming → live at start time | Auto-transition — **NOT implemented** |
| LIF-02 | P0 | live → completed at end time | Auto-transition — **NOT implemented** |
| LIF-03 | P0 | Registration auto-closes at deadline | DB-enforced, not just UI (DEF-007) |
| LIF-04 | P1 | "Filling fast" status auto-set | At threshold % |
| LIF-05 | P1 | sold_out auto-set | When count = max |
| LIF-06 | P1 | Past events archived | Removed from default discover |
| LIF-07 | P1 | Escrow release triggered on completion | Tied to LIF-02 |

**Logic to implement/test:** Supabase Edge Function on `pg_cron` schedule to transition statuses, close registration, trigger escrow release/refund, send notifications.

---

## 12. LIVE SCOREBOARD / TEAM FINDER / CORPORATE

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| LIVE-01 | P1 | Live matches from DB | `live_matches` + updates render |
| LIVE-02 | P1 | Score updates | Real-time or polled refresh |
| LIVE-03 | P2 | Viewer count | Accurate/animated |
| TEAM-01 | P1 | Team Finder list | Real data, join request flow |
| TEAM-02 | P1 | Join a team | Writes to DB |
| CORP-01 | P1 | Corporate packages | From `corporate_packages` table |
| CORP-02 | P1 | Enquiry submission | Writes lead to DB / notifies |

---

## 13. CROSS-CUTTING / NON-FUNCTIONAL

| ID | P | Scenario | Expected |
|----|---|----------|----------|
| NFR-01 | P0 | RLS policies | Users can only edit own profile/events/tickets |
| NFR-02 | P0 | No secrets in client | Service keys not shipped in APK |
| NFR-03 | P1 | Offline behavior | Graceful, no crash, retry |
| NFR-04 | P1 | Slow network | Loading states, timeouts |
| NFR-05 | P1 | Error surfacing | Real errors shown, not silent mock fallback (DEF-006) |
| NFR-06 | P1 | Tab labels fit all devices | "Tickets" not truncated (FIXED) |
| NFR-07 | P1 | Back button / nav | No dead-ends, no stuck modals |
| NFR-08 | P2 | Accessibility | Tap targets ≥44px, contrast |
| NFR-09 | P1 | Crash-free | No unhandled promise rejections |
| NFR-10 | P0 | Input sanitization | SQL/script injection in text fields handled by parameterized queries |
| NFR-11 | P1 | Date/timezone | IST handling consistent across create/display |
| NFR-12 | P1 | Currency formatting | ₹ consistent, no float errors |

---

## PRIORITIZED IMPLEMENTATION BACKLOG (logic to build + test)

### Must-have before any real launch (P0)
1. **Fix create-event schema mapping** (DEF-001/002) — match real columns + child tables.
2. **Restore real auth** (DEF-003) — OTP provider OR a real seeded test session; writes need real `auth.uid()`.
3. **Razorpay key + server-side verification** (DEF-004) — webhook-confirmed tickets.
4. **Atomic registration transaction** — debit + ticket + count in one Postgres function; duplicate guard `(event_id,user_id)`.
5. **Event lifecycle scheduler** — `pg_cron` Edge Function for status transitions + registration close.
6. **Escrow engine** — holding, release on completion, refund on cancellation.

### Important (P1)
7. Real profile stats (`user_stats` table + computation).
8. Wallet add-money / withdraw / transaction history.
9. Error surfacing instead of silent mock fallback.
10. Event not-found handling.
11. Ticket cancellation + refund.
12. RLS audit across all tables.

### Polish (P2)
13. Pagination, sort options, avatar upload, QR check-in, accessibility.

---

## SUGGESTED TEST EXECUTION ORDER
1. Fix P0 defects (DEF-001..004) — otherwise write-path tests all fail.
2. Auth → Create Event → Discover (does new event appear?) → Detail → Register/Pay → Tickets → Wallet → Profile.
3. Lifecycle (time-based) tests with manipulated event times.
4. Concurrency & negative tests.
5. NFR/security pass.
