-- ============================================================
-- 007_cricket_scoring.sql
-- Togo — CricHeroes-style ball-by-ball cricket scoring.
-- cricket_matches = match state (innings, striker, bowler...).
-- cricket_balls   = every delivery; the full scorecard derives from this.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.cricket_matches (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references public.events(id) on delete cascade,
  live_match_id uuid references public.live_matches(id) on delete set null,
  overs_limit  int  not null default 20,
  team_a       text not null default 'Team A',
  team_b       text not null default 'Team B',
  bat_first    text not null default 'a' check (bat_first in ('a','b')),
  innings      int  not null default 1,
  striker      text not null default '',
  non_striker  text not null default '',
  bowler       text not null default '',
  status       text not null default 'setup' check (status in ('setup','live','innings_break','done')),
  target       int,
  result       text not null default '',
  created_at   timestamptz not null default now()
);

-- Every delivery. legal = counts toward the over (wides/no-balls do not).
create table if not exists public.cricket_balls (
  id           uuid primary key default gen_random_uuid(),
  cmatch_id    uuid not null references public.cricket_matches(id) on delete cascade,
  innings      int  not null,
  over_no      int  not null,         -- 0-based over index when bowled
  ball_in_over int  not null,         -- legal ball number 1..6 (0 for illegal-only)
  legal        boolean not null default true,
  striker      text not null,
  non_striker  text not null,
  bowler       text not null,
  runs_off_bat int  not null default 0,
  extra_type   text,                  -- wide | noball | bye | legbye | null
  extra_runs   int  not null default 0,
  wicket       boolean not null default false,
  wicket_type  text,
  out_player   text,
  seq          bigint generated always as identity,
  created_at   timestamptz not null default now()
);

create index if not exists cricket_balls_match_idx on public.cricket_balls (cmatch_id, seq);

alter table public.cricket_matches enable row level security;
alter table public.cricket_balls   enable row level security;

drop policy if exists "cricket matches readable" on public.cricket_matches;
create policy "cricket matches readable" on public.cricket_matches for select to authenticated using (true);

drop policy if exists "cricket balls readable" on public.cricket_balls;
create policy "cricket balls readable" on public.cricket_balls for select to authenticated using (true);

-- Organizer of the event may score.
drop policy if exists "organizer writes cricket matches" on public.cricket_matches;
create policy "organizer writes cricket matches" on public.cricket_matches
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = cricket_matches.event_id and e.organizer_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = cricket_matches.event_id and e.organizer_id = auth.uid()));

drop policy if exists "organizer writes cricket balls" on public.cricket_balls;
create policy "organizer writes cricket balls" on public.cricket_balls
  for all to authenticated
  using (exists (
    select 1 from public.cricket_matches cm join public.events e on e.id = cm.event_id
    where cm.id = cricket_balls.cmatch_id and e.organizer_id = auth.uid()))
  with check (exists (
    select 1 from public.cricket_matches cm join public.events e on e.id = cm.event_id
    where cm.id = cricket_balls.cmatch_id and e.organizer_id = auth.uid()));

-- Realtime so viewers see each ball instantly.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cricket_balls') then
    alter publication supabase_realtime add table public.cricket_balls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cricket_matches') then
    alter publication supabase_realtime add table public.cricket_matches;
  end if;
end $$;
