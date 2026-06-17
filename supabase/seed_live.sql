-- ============================================================
-- seed_live.sql
-- Togo — demo LIVE matches with team scores, per-player stats and commentary.
-- Run AFTER 003_live_scoring.sql and seed_events.sql.
-- Safe to re-run: deletes its own matches first (match_players + updates cascade).
-- Run in Supabase SQL Editor.
-- ============================================================

delete from public.live_matches
where title in ('Mumbai T20 — Final', 'Pro Kabaddi Semi-Final', 'Futsal Cup Semi-Final 1');

-- ------------------------------------------------------------
-- 1. Live matches (linked to seed events where they exist).
-- ------------------------------------------------------------
insert into public.live_matches (event_id, category, title, emoji, status, team_a, team_b, score_a, score_b, prize_pool, viewers)
select id, 'cricket', 'Mumbai T20 — Final', '🏏', '1st Innings · 18.2 ov', 'Bandra Blasters', 'Andheri Aces', '142/6', 'Yet to bat', 100000, 1240
  from public.events where title = 'Mumbai T20 Champions Cup'
union all
select id, 'kabaddi', 'Pro Kabaddi Semi-Final', '🤼', '2nd Half · 12:30', 'Chennai Chargers', 'Delhi Dabang', '34', '29', 60000, 860
  from public.events where title = 'Pro Kabaddi Open Championship'
union all
select id, 'football', 'Futsal Cup Semi-Final 1', '⚽', '2nd Half · 38''', 'Indiranagar FC', 'HSR United', '3', '2', 25000, 540
  from public.events where title = 'Futsal Friday Night Cup';

-- ------------------------------------------------------------
-- 2. Per-player stats (score = the individual number; detail = sport nuance).
-- ------------------------------------------------------------
insert into public.match_players (match_id, team_side, player_name, score, detail, is_active, sort_order)
select m.id, v.team_side, v.player_name, v.score, v.detail, v.is_active, v.sort_order
from public.live_matches m
join (values
  -- Cricket — Bandra Blasters batting (a)
  ('Mumbai T20 — Final', 'a', 'Rahul Sharma',   64, '64 (38b, 5x4 2x6)', true,  1),
  ('Mumbai T20 — Final', 'a', 'Imran Khan',      41, '41 (29b, 3x4)',     true,  2),
  ('Mumbai T20 — Final', 'a', 'Vikram Rao',      18, '18 (11b, 1x6)',     false, 3),
  -- Cricket — Andheri Aces bowling (b) — score = wickets
  ('Mumbai T20 — Final', 'b', 'Sandeep Yadav',    2, '2/24 (4 ov)',       false, 1),
  ('Mumbai T20 — Final', 'b', 'Ajay Menon',       1, '1/31 (4 ov)',       false, 2),

  -- Kabaddi — Chennai Chargers (a) — score = raid points
  ('Pro Kabaddi Semi-Final', 'a', 'Arjun Reddy',  12, '12 raid pts',      true,  1),
  ('Pro Kabaddi Semi-Final', 'a', 'Manoj Kumar',   8, '8 raid, 3 tackle', false, 2),
  -- Kabaddi — Delhi Dabang (b)
  ('Pro Kabaddi Semi-Final', 'b', 'Pawan Sehrawat',10,'10 raid pts',      true,  1),
  ('Pro Kabaddi Semi-Final', 'b', 'Ravi Dahiya',    6, '6 raid, 4 tackle',false, 2),

  -- Football — Indiranagar FC (a) — score = goals
  ('Futsal Cup Semi-Final 1', 'a', 'Karthik Nair',  2, '2 goals',         true,  1),
  ('Futsal Cup Semi-Final 1', 'a', 'Sameer Das',    1, '1 goal, 1 assist',false, 2),
  -- Football — HSR United (b)
  ('Futsal Cup Semi-Final 1', 'b', 'Rohit Verma',   1, '1 goal',          false, 1),
  ('Futsal Cup Semi-Final 1', 'b', 'Faisal Ahmed',  1, '1 goal',          false, 2)
) as v(match_title, team_side, player_name, score, detail, is_active, sort_order)
  on v.match_title = m.title;

-- ------------------------------------------------------------
-- 3. Commentary feed.
-- ------------------------------------------------------------
insert into public.live_match_updates (match_id, time_label, text)
select m.id, v.time_label, v.text
from public.live_matches m
join (values
  ('Mumbai T20 — Final', '18.2 ov', 'SIX! Rahul Sharma launches it over long-on — 64 off 38.'),
  ('Mumbai T20 — Final', '17.4 ov', 'FOUR through the covers, Blasters cruising.'),
  ('Mumbai T20 — Final', '16.5 ov', 'WICKET! Vikram holes out to deep mid-wicket for 18.'),
  ('Pro Kabaddi Semi-Final', '12:30', 'SUPER RAID! Arjun Reddy takes 3 — Chargers pull ahead 34-29.'),
  ('Pro Kabaddi Semi-Final', '14:10', 'Pawan Sehrawat with a brilliant escape, 10 raid points.'),
  ('Pro Kabaddi Semi-Final', '16:00', 'All-out on Delhi! Big swing for Chennai.'),
  ('Futsal Cup Semi-Final 1', '38''',  'GOAL! Karthik Nair makes it 3-2, his second of the night.'),
  ('Futsal Cup Semi-Final 1', '31''',  'Sameer Das turns provider, slots Karthik in.'),
  ('Futsal Cup Semi-Final 1', '24''',  'HSR United equalise — end to end stuff.')
) as v(match_title, time_label, text)
  on v.match_title = m.title;

-- ------------------------------------------------------------
-- 4. Verify
-- ------------------------------------------------------------
select m.title, m.category, m.score_a, m.score_b,
       count(p.id) as players, count(u.id) as updates
from public.live_matches m
left join public.match_players p on p.match_id = m.id
left join public.live_match_updates u on u.match_id = m.id
where m.title in ('Mumbai T20 — Final', 'Pro Kabaddi Semi-Final', 'Futsal Cup Semi-Final 1')
group by m.id, m.title, m.category, m.score_a, m.score_b
order by m.title;
