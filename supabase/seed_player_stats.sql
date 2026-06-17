-- ============================================================
-- seed_player_stats.sql
-- Togo — rich career stat history for the Profile (ESPN / CricHeroes style).
-- Multiple finished matches per sport with detailed per-match `stats` JSONB,
-- attached to the most recently created profile (your logged-in user).
-- Run AFTER 004_personal_scores.sql and 005_detailed_stats.sql.
-- Safe to re-run (clears its own 'Career: %' matches first).
-- Run in Supabase SQL Editor.
-- ============================================================

do $$
declare
  uid uuid;
begin
  select id into uid from public.profiles order by created_at desc limit 1;
  if uid is null then
    raise notice 'No profile found — log in and finish profile setup first, then re-run.';
    return;
  end if;

  delete from public.live_matches where title like 'Career: %';

  insert into public.live_matches
    (category, title, emoji, status, team_a, team_b, score_a, score_b, prize_pool, viewers, is_live)
  values
    -- Cricket (6 innings)
    ('cricket', 'Career: T20 vs Rivals CC',     '🏏', 'Completed · Won',  'Your XI', 'Rivals CC',  '178/5', '174/8', 0, 0, false),
    ('cricket', 'Career: League vs Eagles',     '🏏', 'Completed · Lost', 'Your XI', 'Eagles',     '141/9', '142/4', 0, 0, false),
    ('cricket', 'Career: Cup QF vs Strikers',   '🏏', 'Completed · Won',  'Your XI', 'Strikers',   '201/4', '160 ao',0, 0, false),
    ('cricket', 'Career: Friendly vs United',   '🏏', 'Completed · Lost', 'Your XI', 'United',      '98 ao', '99/3', 0, 0, false),
    ('cricket', 'Career: SF vs Titans',         '🏏', 'Completed · Won',  'Your XI', 'Titans',     '167/6', '150/9',0, 0, false),
    ('cricket', 'Career: Final vs Royals',      '🏏', 'Completed · Won',  'Your XI', 'Royals',     '172/3', '169/7',0, 0, false),
    -- Football (3)
    ('football',  'Career: Futsal vs Turf Kings','⚽', 'Completed · Won',  'Your XI', 'Turf Kings', '4', '2', 0, 0, false),
    ('football',  'Career: 5s vs City FC',       '⚽', 'Completed · Won',  'Your XI', 'City FC',    '3', '1', 0, 0, false),
    ('football',  'Career: League vs Rovers',    '⚽', 'Completed · Draw', 'Your XI', 'Rovers',     '2', '2', 0, 0, false),
    -- Kabaddi (2)
    ('kabaddi',   'Career: Mat vs Dabang',       '🤼', 'Completed · Won',  'Your XI', 'Dabang',     '38', '31', 0, 0, false),
    ('kabaddi',   'Career: Open vs Warriors',    '🤼', 'Completed · Lost', 'Your XI', 'Warriors',   '29', '34', 0, 0, false),
    -- Basketball (2)
    ('basketball','Career: 3x3 vs Ballers',      '🏀', 'Completed · Won',  'Your XI', 'Ballers',    '21', '17', 0, 0, false),
    ('basketball','Career: Night vs Hoopers',    '🏀', 'Completed · Lost', 'Your XI', 'Hoopers',    '15', '21', 0, 0, false);

  insert into public.match_players (match_id, user_id, team_side, player_name, score, detail, stats, is_active, sort_order)
  select m.id, uid, 'a', 'You', v.score, v.detail, v.stats::jsonb, false, 0
  from public.live_matches m
  join (values
    -- Cricket: runs + balls + boundaries + out + bowling figures + catches
    ('Career: T20 vs Rivals CC',   72, '72* (48b, 6x4 3x6) · 2/28', '{"runs":72,"balls":48,"fours":6,"sixes":3,"out":false,"overs":4,"runs_conceded":28,"wickets":2,"catches":1}'),
    ('Career: League vs Eagles',   45, '45 (30b) · 0/0',            '{"runs":45,"balls":30,"fours":4,"sixes":1,"out":true,"catches":1}'),
    ('Career: Cup QF vs Strikers',110, '110 (62b) · 1/19',          '{"runs":110,"balls":62,"fours":9,"sixes":5,"out":true,"overs":3,"runs_conceded":19,"wickets":1,"catches":0}'),
    ('Career: Friendly vs United', 12, '12 (9b) · 1/22',            '{"runs":12,"balls":9,"fours":1,"sixes":0,"out":true,"overs":3,"runs_conceded":22,"wickets":1}'),
    ('Career: SF vs Titans',       38, '38 (25b) · 3/31',           '{"runs":38,"balls":25,"fours":3,"sixes":1,"out":true,"overs":4,"runs_conceded":31,"wickets":3,"catches":1}'),
    ('Career: Final vs Royals',    64, '64* (40b) · 0/14',          '{"runs":64,"balls":40,"fours":5,"sixes":2,"out":false,"overs":2,"runs_conceded":14,"wickets":0}'),
    -- Football: goals / assists / minutes
    ('Career: Futsal vs Turf Kings',2, '2 goals, 1 assist',         '{"goals":2,"assists":1,"minutes":40}'),
    ('Career: 5s vs City FC',       1, '1 goal',                    '{"goals":1,"assists":0,"minutes":50}'),
    ('Career: League vs Rovers',    0, '2 assists',                 '{"goals":0,"assists":2,"minutes":90}'),
    -- Kabaddi: raid / tackle points
    ('Career: Mat vs Dabang',      12, '12 raid, 3 tackle',         '{"raid_points":12,"tackle_points":3}'),
    ('Career: Open vs Warriors',    8, '8 raid, 5 tackle',          '{"raid_points":8,"tackle_points":5}'),
    -- Basketball: pts / reb / ast / stl
    ('Career: 3x3 vs Ballers',     24, '24 pts, 8 reb, 5 ast',      '{"points":24,"rebounds":8,"assists":5,"steals":2}'),
    ('Career: Night vs Hoopers',   18, '18 pts, 11 reb, 7 ast',     '{"points":18,"rebounds":11,"assists":7,"steals":1}')
  ) as v(title, score, detail, stats) on v.title = m.title;

  raise notice 'Seeded career stats (13 matches) for profile %', uid;
end $$;

-- Career summary preview (cricket batting)
select count(*) filter (where category = 'cricket')   as cricket_innings,
       count(*) filter (where category = 'football')   as football_matches,
       count(*) filter (where category = 'kabaddi')    as kabaddi_matches,
       count(*) filter (where category = 'basketball') as basketball_matches
from public.match_players mp
join public.live_matches m on m.id = mp.match_id
where mp.user_id = (select id from public.profiles order by created_at desc limit 1)
  and m.title like 'Career: %';
