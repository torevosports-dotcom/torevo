-- ============================================================
-- 005_detailed_stats.sql
-- Togo — detailed per-player, per-match statistics (ESPN / CricHeroes style).
-- A flexible JSONB column holds sport-specific numbers; the app aggregates
-- them into career stats. Works for every sport without a schema change.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Detailed stat line for a player in a match. Shape varies by sport, e.g.:
--   cricket  : {"runs":72,"balls":48,"fours":6,"sixes":3,"out":false,
--               "overs":4,"runs_conceded":28,"wickets":2,"catches":1}
--   football : {"goals":2,"assists":1,"minutes":90,"yellow":0,"red":0}
--   kabaddi  : {"raid_points":12,"tackle_points":3}
--   basketball:{"points":24,"rebounds":8,"assists":5,"steals":2}
alter table public.match_players
  add column if not exists stats jsonb not null default '{}'::jsonb;
