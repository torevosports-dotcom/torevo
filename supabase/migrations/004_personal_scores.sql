-- ============================================================
-- 004_personal_scores.sql
-- Togo — tie player stat lines to an app user (personal history in Profile)
-- and separate currently-live matches from finished ones.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

-- A stat line can belong to a registered user → shows in their Profile history.
alter table public.match_players
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists match_players_user_idx on public.match_players (user_id);

-- "Live Now" vs finished. History matches are is_live = false.
alter table public.live_matches
  add column if not exists is_live boolean not null default true;
