-- ============================================================
-- seed_personal_scores.sql
-- Togo — demo personal match history for the Profile screen.
-- Attaches finished (is_live=false) matches + your stat lines to the most
-- recently created profile (i.e. the user you logged in as).
-- Run AFTER 004_personal_scores.sql.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

do $$
declare
  uid uuid;
begin
  select id into uid from public.profiles order by created_at desc limit 1;
  if uid is null then
    raise notice 'No profile found — log in and finish profile setup in the app first, then re-run.';
    return;
  end if;

  -- Clean prior demo history (cascades match_players).
  delete from public.live_matches
  where title in ('Weekend Cricket League — R3', 'Saturday Futsal Cup', 'Club Badminton Night');

  -- Finished matches (is_live = false → stay out of "Live Now").
  insert into public.live_matches
    (category, title, emoji, status, team_a, team_b, score_a, score_b, prize_pool, viewers, is_live)
  values
    ('cricket',   'Weekend Cricket League — R3', '🏏', 'Completed · Won', 'Your XI', 'Rivals CC',   '156/7', '152/9', 5000, 0, false),
    ('football',  'Saturday Futsal Cup',         '⚽', 'Completed · Won', 'Your XI', 'Turf Kings',  '4',     '2',     3000, 0, false),
    ('badminton', 'Club Badminton Night',        '🏸', 'Completed · Won', 'You',     'A. Sharma',   '2',     '0',     0,    0, false);

  -- Your individual stat lines in those matches.
  insert into public.match_players (match_id, user_id, team_side, player_name, score, detail, is_active, sort_order)
  select id, uid, 'a', 'You', 72, '72* (48b, 6x4 3x6)',      false, 0 from public.live_matches where title = 'Weekend Cricket League — R3'
  union all
  select id, uid, 'a', 'You',  2, '2 goals, 1 assist',        false, 0 from public.live_matches where title = 'Saturday Futsal Cup'
  union all
  select id, uid, 'a', 'You',  2, 'Won 2-0 (21-18, 21-15)',   false, 0 from public.live_matches where title = 'Club Badminton Night';

  raise notice 'Attached 3 match-history rows to profile %', uid;
end $$;

-- Verify your history
select mp.player_name, m.title, m.category, mp.score, mp.detail
from public.match_players mp
join public.live_matches m on m.id = mp.match_id
where mp.user_id = (select id from public.profiles order by created_at desc limit 1)
order by mp.updated_at desc;
