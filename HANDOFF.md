# Togo Mobile App — Session Handoff

> Read this first if you opened `D:\TogoApp` in a fresh Claude Code session.
> The prior work was done from a session opened in `d:\Togo` (the separate web project),
> editing this folder via absolute paths. All work is intact here.

## Project facts
- **This folder (`D:\TogoApp`)** = the React Native + Expo mobile app. Git repo. Builds the APK.
- **`d:\Togo`** = a SEPARATE Vite + React **web** app (`togo-sports-events`). Independent. Not needed for the mobile app.
- Backend: Supabase project `https://civkfamfwsxdcvoyucxy.supabase.co`
- Build: Gradle 8.13, `compileSdk 36`, Kotlin 2.1.20, arm64-only filter attempted.
- APK output: `android\app\build\outputs\apk\release\app-release.apk`

## Build command (PowerShell)
```
Set-Location "D:\TogoApp\android"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\nanus\AppData\Local\Android\Sdk"
.\gradlew.bat :app:clean assembleRelease --no-daemon
```

## What was done this session
1. **APK build fixed** — cleared full C: drive, killed stale Gradle lock, bumped compileSdk to 36.
2. **Login OTP bypassed** (no SMS) — now opens a real anonymous Supabase session; falls back to a local mock if anonymous auth is disabled. See `app/(auth)/login.tsx`.
3. **Tab bar labels** — `adjustsFontSizeToFit` so "Tickets" never truncates. `app/(tabs)/_layout.tsx`.
4. **Emojis removed from event cards** — real sport cover photos used instead. `discover.tsx`, `events/[id].tsx`.
5. **Business-logic P0 fixes:**
   - Create Event now writes to Supabase with correct columns + prize row — `app/create-event.tsx`
   - Booking uses atomic `register_for_event` RPC (with legacy fallback) — `stores/eventStore.ts`
   - Duplicate-registration + sold-out guards
   - Double-debit prevented in `app/events/[id].tsx`
   - Profile stats derived from real data (no more `mockPlayerProfile`) — `app/(tabs)/profile.tsx`
6. **QA plan** written: `QA_TEST_PLAN.md` (~120 test cases + defect list).
7. **DB migration** written: `supabase/migrations/002_business_logic.sql`.

## ✅ BACKEND APPLIED (2026-06-16)
1. **`001_initial_schema.sql` applied** — base tables (`events`, `tickets`, `profiles`, `wallet_transactions`, etc.). The DB was empty before this; 002 failed first run with `relation "public.events" does not exist` until 001 was run.
2. **`002_business_logic.sql` applied** — verified live: `escrow_holdings` table, `register_for_event(...)`, `cancel_ticket(uuid)`, `process_event_lifecycle()` RPCs all exist.
3. **`pg_cron` enabled** — `togo-event-lifecycle` cron job scheduled (job id 1, every 5 min). NOTE: the Supabase SQL Editor runs the whole script as one transaction, so on the first attempt the cron line failed (extension off) and rolled back ALL of 002. Fix was: Database → Extensions → enable pg_cron, then re-run 002.
4. **Anonymous sign-in enabled** — Authentication → Sign In / Providers → Allow anonymous sign-ins = ON. Captcha intentionally left OFF (app login flow has no captcha handling).
5. **`.env`** — `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` populated. `EXPO_PUBLIC_RAZORPAY_KEY_ID` still empty (optional; wallet/free paths work without it).

## ✅ CONTENT + IMAGES (2026-06-16, later session)
- **BY SPORT images** — `app/(tabs)/index.tsx SPORTS_GRID` uses local `assets/sports/*.png` (10 sports incl. pickleball). New `chess.png` / `kabaddi.png` art supplied by user. These local PNGs are used ONLY in BY SPORT.
- **Cover images** (`lib/utils.ts categoryMeta`) and **create-event picker** use remote Unsplash photos — deliberately SEPARATE from the BY SPORT art (user requirement). Covers fetched at 800x400 (2:1).
- **Events seeded** — `supabase/seed_events.sql` applied: 20 events, 2 per sport, 13 distinct host personas (verified clubs + casual hosts), host-voiced copy, prize splits + rules. Re-runnable. App reads them live via `eventStore.fetchEvents()` (already dynamic; mock is only a fallback).
- Latest APK built 14:53 (`android/app/build/outputs/apk/release/app-release.apk`).

## ✅ SCORING + HOSTING PLATFORM (2026-06-16, later session)
Migrations 003–009 (apply in order in Supabase SQL Editor) + seeds. Build v12.
- **Live scoring model:** `live_matches` (team) + `match_players` (per-player, `stats` JSONB) + `score_events` (generic event log, non-cricket) + `cricket_matches`/`cricket_balls` (ball-by-ball). Realtime on all.
- **Career stats:** `lib/stats.ts` aggregates `match_players` → Profile "Career Stats" (cricket avg/SR/econ; generic totals other sports). `match_players.user_id` links to a profile; `players` table is a phone-keyed directory (`player_id`).
- **Live screen** (`/live`, reached via ● LIVE button on Home header) shows team + per-player breakdown; filters `is_live=true`.
- **Host Dashboard** (`/host-dashboard`, button on Profile): lists organized + umpiring events. Assign umpire by phone.
- **Scorers:** cricket → `app/scorer/cricket/[id].tsx` (ball-by-ball); all other sports → `app/scorer/[id].tsx` (unified, palettes in `lib/scoring-config.ts`, derive in `lib/scoring.ts`).
- **Access control:** `can_score(event)` = organizer OR `events.umpire_id`. Umpire auto-links by phone on signup (authStore.createProfile).
- **Seeds:** `seed_events.sql` (20 events/13 hosts), `seed_live.sql` (3 live matches), `seed_player_stats.sql` (career history for latest profile).

## 🔜 NEXT (planned, not built)
1. **Contacts import** (expo-contacts) for adding players — native dep, needs `npm install` + new build + Expo v56 docs.
2. **Push notifications** (expo-notifications) — tournament-start alerts to registered players + host. Native dep.
3. **Public cricket scorecard view** (full batting/bowling card for viewers; Live screen currently shows mirrored total).
4. Cricket engine edge cases: wicket on last ball of over, undo restoring striker/bowler pointers, dismissal types.

## ⚠️ STILL OUTSTANDING
1. **Razorpay key** (optional): set `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `.env`.
2. Run through `QA_TEST_PLAN.md`.
3. Optional: seed `corporate_packages` (Corporate screen empty).

## Still mocked / not implemented (see QA_TEST_PLAN.md for full list)
- Escrow is a real ledger ONLY after migration 002 is applied; UI label otherwise.
- Wallet "Add Money" / "Withdraw" buttons are non-functional.
- No transaction-history screen.
- Razorpay server-side payment verification (webhook) not implemented.
- Event status auto-transitions only work after migration 002 + pg_cron.

## Known non-issue
- `tsc` reports `Cannot find module '../../lib/razorpay'` — false alarm; Metro resolves the platform-specific file at build time. Builds succeed.
