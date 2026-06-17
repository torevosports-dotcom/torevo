-- ============================================================
-- 003_live_scoring.sql
-- Togo — per-player live scoring on top of team-level live_matches.
-- Adds match_players (individual stats) + live_matches.category.
-- Safe to re-run: IF NOT EXISTS / guarded publication add.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. live_matches: which sport (mapper previously hardcoded 'cricket').
-- ------------------------------------------------------------
alter table public.live_matches
  add column if not exists category text not null default 'cricket';

-- ------------------------------------------------------------
-- 2. Per-player live stats. One flexible row per player in a match.
--    score = the individual number (runs / goals / points).
--    detail = sport-specific line ("45 (32b, 4x4)", "2G 1A", "8 raid pts").
-- ------------------------------------------------------------
create table if not exists public.match_players (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.live_matches(id) on delete cascade,
  team_side   text not null check (team_side in ('a','b')),
  player_name text not null,
  score       numeric not null default 0,
  detail      text not null default '',
  is_active   boolean not null default false,   -- striker / on-court / current
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists match_players_match_idx on public.match_players (match_id);

alter table public.match_players enable row level security;

drop policy if exists "match players readable" on public.match_players;
create policy "match players readable" on public.match_players
  for select to authenticated using (true);

-- Organizers of the linked event may write scores (scorer screen).
drop policy if exists "organizer writes match players" on public.match_players;
create policy "organizer writes match players" on public.match_players
  for all to authenticated
  using (
    exists (
      select 1 from public.live_matches lm
      join public.events e on e.id = lm.event_id
      where lm.id = match_players.match_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.live_matches lm
      join public.events e on e.id = lm.event_id
      where lm.id = match_players.match_id and e.organizer_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3. Realtime: stream player stat changes to the app (guarded add).
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'match_players'
  ) then
    alter publication supabase_realtime add table public.match_players;
  end if;
end $$;
