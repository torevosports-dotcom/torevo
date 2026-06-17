-- ============================================================
-- 009_score_events.sql
-- Togo — unified event log for non-cricket sports (football, basketball,
-- kabaddi, volleyball, racket sports, esports). One row per scoring action;
-- team score + per-player stats derive from it. Undo = delete last event.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.score_events (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references public.live_matches(id) on delete cascade,
  match_player_id uuid references public.match_players(id) on delete cascade,
  team_side       text not null check (team_side in ('a','b')),
  action          text not null,         -- e.g. goal, p2, raid2, ace, round
  points          int  not null default 0,  -- contribution to the team score
  stat_key        text,                  -- match_players.stats key to bump
  stat_val        int  not null default 0,
  seq             bigint generated always as identity,
  created_at      timestamptz not null default now()
);

create index if not exists score_events_match_idx on public.score_events (match_id, seq);

alter table public.score_events enable row level security;

drop policy if exists "score events readable" on public.score_events;
create policy "score events readable" on public.score_events for select to authenticated using (true);

drop policy if exists "scorer writes score events" on public.score_events;
create policy "scorer writes score events" on public.score_events
  for all to authenticated
  using (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)))
  with check (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='score_events') then
    alter publication supabase_realtime add table public.score_events;
  end if;
end $$;
