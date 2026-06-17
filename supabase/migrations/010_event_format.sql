-- ============================================================
-- 010_event_format.sql
-- Togo — game-aware event config: team/doubles/individual format,
-- configurable team size & team count, and team-vs-person fee mode.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

alter table public.events
  add column if not exists format    text not null default 'individual'
      check (format in ('team','doubles','individual')),
  add column if not exists team_size  int,   -- players per team (team/doubles)
  add column if not exists team_count int,   -- number of teams (team/doubles)
  add column if not exists fee_mode   text not null default 'per_person'
      check (fee_mode in ('per_team','per_person'));

-- Backfill existing rows: anything with a team_size_min is a team event.
update public.events
set format = 'team', fee_mode = 'per_team',
    team_size = coalesce(team_size, team_size_min),
    team_count = coalesce(team_count, greatest(1, max_participants / nullif(team_size_min,0)))
where format = 'individual' and team_size_min is not null;
