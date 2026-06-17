-- ============================================================
-- 006_host_scoring.sql
-- Togo — host scoring backbone: a phone-keyed players directory and
-- write policies so an event's organizer can run the Scorer.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Players directory — keyed by phone so stats can be viewed by mobile
--    number, and any player (app user or not) has one identity across matches.
-- ------------------------------------------------------------
create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  phone      text unique,
  name       text not null,
  city       text not null default '',
  user_id    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

drop policy if exists "players readable" on public.players;
create policy "players readable" on public.players
  for select to authenticated using (true);

-- Any signed-in host may add/look-up players (directory is shared).
drop policy if exists "players writable" on public.players;
create policy "players writable" on public.players
  for all to authenticated using (true) with check (true);

-- Link a per-match stat line to a directory player.
alter table public.match_players
  add column if not exists player_id uuid references public.players(id) on delete set null;

-- ------------------------------------------------------------
-- 2. Organizer can create/update the live match for their own event.
-- ------------------------------------------------------------
drop policy if exists "organizer writes live matches" on public.live_matches;
create policy "organizer writes live matches" on public.live_matches
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = live_matches.event_id and e.organizer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = live_matches.event_id and e.organizer_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- 3. Organizer can post commentary for their own match.
-- ------------------------------------------------------------
drop policy if exists "organizer writes updates" on public.live_match_updates;
create policy "organizer writes updates" on public.live_match_updates
  for all to authenticated
  using (exists (
    select 1 from public.live_matches lm
    join public.events e on e.id = lm.event_id
    where lm.id = live_match_updates.match_id and e.organizer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.live_matches lm
    join public.events e on e.id = lm.event_id
    where lm.id = live_match_updates.match_id and e.organizer_id = auth.uid()
  ));
