-- ============================================================
-- seed_events.sql
-- Togo — sample events for every sport shown in BY SPORT.
-- Authored as a real platform would look: many distinct host personas
-- (established verified clubs + smaller casual hosts), host-voiced copy.
-- Data lives in Supabase; the app reads it live via eventStore.fetchEvents().
-- Safe to re-run: deletes its own seed rows first (by the seed host list).
-- Run in Supabase SQL Editor (postgres role bypasses RLS).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Clean previous seed so re-runs don't duplicate.
--    event_prizes / event_rules cascade on delete.
-- ------------------------------------------------------------
delete from public.events where organizer_name in (
  'Mumbai Cricket League', 'Weekend Warriors Mumbai', 'TurfXI Sports Club',
  'Capital Hoops Delhi', 'Night Owls Hoops', 'Smash Badminton Academy',
  'Pro Kabaddi Federation', 'CyberArena Esports', 'Nexus Gaming Collective',
  'Coastline Volleyball Club', 'Deccan Chess Circle', 'SpinZone TT Club',
  'Ace Pickleball Club'
);
delete from public.events where title in ('Pro Kabaddi Showdown', 'City Chess Open');

-- ------------------------------------------------------------
-- 1. Events — 2 per sport across 10 sports. Each carries its host's real
--    identity (name, rating, events hosted, verified). Mix of statuses,
--    event_types, skill levels, free/paid, prize/no-prize.
-- ------------------------------------------------------------
insert into public.events
  (title, description, category, event_type, status, date, time, registration_deadline,
   venue_name, venue_address, city, state, max_participants, current_participants,
   team_size_min, team_size_max, entry_fee, prize_pool, escrow_protected, skill_level,
   refund_policy, equipment_provided,
   organizer_name, organizer_rating, organizer_events_hosted, organizer_verified)
values
  -- Cricket
  ('Mumbai T20 Champions Cup', 'Our flagship T20 knockout is back for its 9th season! 16 teams, leather-ball format, accredited umpires and live digital scoring. ₹1,00,000 prize pool split across the top three. Squads of 11-15; lunch and refreshments included for every player. Spots fill fast every year.', 'cricket', 'tournament', 'filling', '2026-06-28', '08:00', '2026-06-25', 'Wankhede Maidan', 'D Road, Churchgate', 'Mumbai', 'Maharashtra', 160, 138, 11, 15, 1200, 100000, true, 'advanced', 'Full refund up to 72 hours before start.', true, 'Mumbai Cricket League', 4.8, 64, true),
  ('Sunday Gully Cricket Bash', 'Just a bunch of us who love weekend cricket. Tennis-ball, tape-ball friendly format at Shivaji Park - no pressure, all skill levels welcome. Bring your gang (6-8) or come solo and we will slot you into a side. ₹300 covers the ground and balls.', 'cricket', 'casual', 'upcoming', '2026-07-05', '07:30', '2026-07-03', 'Shivaji Park', 'Dadar West', 'Mumbai', 'Maharashtra', 96, 40, 6, 8, 300, 0, false, 'all', 'No refund within 24 hours.', false, 'Weekend Warriors Mumbai', 4.4, 9, false),

  -- Football
  ('Bangalore 5-a-side League', 'Four-weekend 5-a-side league on our premium FIFA-grade turf. Round-robin group stage followed by playoffs. Professional refs, bibs and water provided. ₹40,000 prize pool for the winning side. Squads of 5-7 - bring your subs!', 'football', 'league', 'upcoming', '2026-07-04', '18:00', '2026-07-01', 'PlayArena Turf', 'Sarjapur Road', 'Bangalore', 'Karnataka', 80, 52, 5, 7, 900, 40000, true, 'intermediate', 'Full refund up to 48 hours before kickoff.', true, 'TurfXI Sports Club', 4.7, 35, true),
  ('Futsal Friday Night Cup', 'Friday night lights, fast futsal action. Single-day knockout on our indoor court with rolling subs and 2x12 minute halves. Limited to 10 teams so register early - the last three editions sold out within the week.', 'football', 'tournament', 'sold_out', '2026-06-26', '20:00', '2026-06-24', 'Turf XI Arena', 'Indiranagar', 'Bangalore', 'Karnataka', 60, 60, 5, 6, 700, 25000, true, 'advanced', 'No refund within 48 hours.', true, 'TurfXI Sports Club', 4.7, 35, true),

  -- Basketball
  ('Delhi 3x3 Hoops Showdown', 'Official 3x3 street-ball showdown, FIBA half-court rules. Win-by-2 to 21 or a 10-minute cap. Single-elimination brackets with a DJ on site. Squads of 3 with one sub allowed. ₹30,000 on the line.', 'basketball', 'tournament', 'upcoming', '2026-07-12', '16:00', '2026-07-09', 'Thyagaraj Stadium Court', 'INA Colony', 'Delhi', 'Delhi', 48, 18, 3, 4, 600, 30000, true, 'intermediate', 'Full refund up to 72 hours before.', true, 'Capital Hoops Delhi', 4.6, 22, true),
  ('Midnight Basketball Run', 'Late-night pickup runs for hoopers who cannot sleep. Register solo - we draft balanced teams on the spot and run games to 11. Floodlit court, good vibes only. ₹250 entry.', 'basketball', 'casual', 'upcoming', '2026-07-19', '21:00', '2026-07-17', 'Hoopers Hub', 'Saket', 'Delhi', 'Delhi', 40, 12, null, null, 250, 0, false, 'all', 'No refund within 24 hours.', false, 'Night Owls Hoops', 4.3, 6, false),

  -- Badminton
  ('Chennai Open Badminton Singles', 'State-level singles championship on wooden sprung courts with feather shuttles. Seeded knockout draw and certified line judges. ₹35,000 prize pool. BWF service rules enforced - bring your A-game.', 'badminton', 'tournament', 'filling', '2026-06-29', '09:00', '2026-06-26', 'SDAT Stadium Courts', 'Nungambakkam', 'Chennai', 'Tamil Nadu', 64, 58, null, null, 500, 35000, true, 'advanced', 'Full refund up to 48 hours before.', true, 'Smash Badminton Academy', 4.8, 41, true),
  ('Doubles Smash Workshop', 'A 2-hour coaching workshop with our head coach on doubles rotation, net kills and defence. Ideal for beginners and improvers. Shuttles and loaner rackets provided. Small batch of 24 for personal attention.', 'badminton', 'workshop', 'upcoming', '2026-07-08', '17:30', '2026-07-06', 'Shuttle Zone Academy', 'Velachery', 'Chennai', 'Tamil Nadu', 24, 9, null, null, 800, 0, false, 'beginner', 'Full refund up to 24 hours before.', true, 'Smash Badminton Academy', 4.8, 41, true),

  -- Kabaddi
  ('Pro Kabaddi Open Championship', 'Standard mat kabaddi under PKL rules with trained referees and a technical panel. Seven on court (squad up to 12), two 20-minute halves. ₹60,000 prize pool and medals for semi-finalists. Mat, bibs and physio on site.', 'kabaddi', 'tournament', 'upcoming', '2026-07-15', '18:00', '2026-07-12', 'Nehru Indoor Stadium', 'Sydenhams Road', 'Chennai', 'Tamil Nadu', 84, 36, 7, 12, 400, 60000, true, 'advanced', 'Full refund up to 72 hours before.', true, 'Pro Kabaddi Federation', 4.9, 30, true),
  ('Corporate Kabaddi Cup', 'An inter-company kabaddi cup built for working professionals - prove your office has the strongest raiders! Squads of 7-12 must carry company ID. League stage into knockouts. ₹45,000 prize pool.', 'kabaddi', 'tournament', 'upcoming', '2026-08-02', '10:00', '2026-07-30', 'YMCA Grounds', 'Nandanam', 'Chennai', 'Tamil Nadu', 96, 24, 7, 12, 600, 45000, true, 'intermediate', 'No refund within 48 hours.', true, 'Pro Kabaddi Federation', 4.9, 30, true),

  -- Esports
  ('BGMI Battlegrounds LAN', 'Squad BGMI on a managed LAN - gaming rigs, 144Hz monitors and stable lines provided. Points-based across 6 matches, streamed live on our channel. ₹80,000 prize pool. 25 squads of 4. Anti-cheat enforced throughout.', 'esports', 'tournament', 'filling', '2026-06-27', '12:00', '2026-06-25', 'CyberArena LAN Cafe', 'HSR Layout', 'Bangalore', 'Karnataka', 100, 92, 4, 4, 500, 80000, true, 'pro', 'No refund within 48 hours.', true, 'CyberArena Esports', 4.8, 52, true),
  ('Valorant Community Cup', 'Community-run Valorant 5v5 for amateur rosters. Best-of-1 groups, Bo3 playoffs on Riot servers. PCs provided - bring your own peripherals. Casual but competitive; climb the bracket and earn from the ₹50,000 pool.', 'esports', 'tournament', 'upcoming', '2026-07-20', '11:00', '2026-07-17', 'Nexus Gaming Hub', 'Koramangala', 'Bangalore', 'Karnataka', 80, 30, 5, 6, 400, 50000, true, 'intermediate', 'Full refund up to 72 hours before.', false, 'Nexus Gaming Collective', 4.5, 13, false),

  -- Volleyball
  ('Beach Volleyball Smash', 'Doubles beach volleyball on the sand by Marina. Rally scoring to 21, best of 3 sets. Sunscreen, shade and chilled water on us. Teams of 2 (one sub allowed). ₹20,000 prize pool plus a beachside breakfast.', 'volleyball', 'tournament', 'upcoming', '2026-07-11', '15:00', '2026-07-08', 'Marina Sands Court', 'Marina Beach', 'Chennai', 'Tamil Nadu', 48, 16, 2, 4, 400, 20000, true, 'intermediate', 'Full refund up to 48 hours before.', true, 'Coastline Volleyball Club', 4.5, 14, true),
  ('Indoor Volleyball League Night', 'Six-a-side evening league on cushioned indoor courts. Friendly, mixed-skill format spread over the month. Referees and scoreboard provided. Squads of 6-9 - great for clubs and friend groups alike.', 'volleyball', 'league', 'upcoming', '2026-07-25', '19:00', '2026-07-22', 'Smash Court Indoor', 'Anna Nagar', 'Chennai', 'Tamil Nadu', 72, 30, 6, 9, 500, 18000, true, 'all', 'No refund within 24 hours.', true, 'Coastline Volleyball Club', 4.5, 14, true),

  -- Chess
  ('Hyderabad Rapid Chess Open', 'FIDE-rated rapid open, 7-round Swiss at a 15+10 time control. DGT boards on the top tables and AICF arbiters. ₹40,000 prize fund with category prizes for U1600 and veterans. Bring your own clock if you can.', 'chess', 'tournament', 'filling', '2026-06-30', '10:00', '2026-06-27', 'Grand Convention Hall', 'Banjara Hills', 'Hyderabad', 'Telangana', 120, 108, null, null, 350, 40000, true, 'advanced', 'Full refund up to 72 hours before.', false, 'Deccan Chess Circle', 4.9, 38, true),
  ('Blitz Chess Friday', 'Friday-evening blitz arena at 5+0 - play as many games as you can squeeze in. Relaxed cafe setting with filter coffee flowing. Open to all ratings. A small ₹8,000 pot for the top boards.', 'chess', 'casual', 'upcoming', '2026-07-10', '18:00', '2026-07-09', 'The Knight Cafe', 'Gachibowli', 'Hyderabad', 'Telangana', 64, 22, null, null, 150, 8000, false, 'all', 'No refund within 24 hours.', false, 'Deccan Chess Circle', 4.9, 38, true),

  -- Table Tennis
  ('Pune TT Championship', 'Singles table tennis championship on approved tables with 40+ balls. Group stage into knockouts with umpired finals. ₹25,000 prize pool. Non-marking shoes mandatory on court.', 'table_tennis', 'tournament', 'upcoming', '2026-07-13', '09:30', '2026-07-10', 'Shree TT Academy', 'Kothrud', 'Pune', 'Maharashtra', 64, 26, null, null, 400, 25000, true, 'advanced', 'Full refund up to 48 hours before.', true, 'SpinZone TT Club', 4.6, 19, true),
  ('Office TT Doubles Meetup', 'Casual after-work doubles for professionals. Round-robin with a random partner draw so you meet new players. Bats and balls provided. ₹250 includes a post-game chai. Just turn up and play.', 'table_tennis', 'casual', 'upcoming', '2026-07-23', '19:30', '2026-07-21', 'Spin Zone Club', 'Hinjewadi', 'Pune', 'Maharashtra', 32, 10, 2, 2, 250, 0, false, 'beginner', 'No refund within 24 hours.', true, 'SpinZone TT Club', 4.6, 19, true),

  -- Pickleball
  ('Pickleball Doubles Open', 'The city pickleball scene is booming - join our doubles open on dedicated outdoor courts. Rally to 11, win by 2, best of 3, USA Pickleball rules. Paddles available to rent. ₹30,000 prize pool.', 'pickleball', 'tournament', 'upcoming', '2026-07-18', '07:00', '2026-07-15', 'Ace Pickle Courts', 'Whitefield', 'Bangalore', 'Karnataka', 48, 20, 2, 2, 600, 30000, true, 'intermediate', 'Full refund up to 72 hours before.', true, 'Ace Pickleball Club', 4.7, 11, true),
  ('Beginner Pickleball Clinic', 'Brand new to pickleball? This 90-minute clinic with certified coaches covers the serve, dinking and kitchen rules. All gear provided - just bring water and court shoes. Small group, lots of court time.', 'pickleball', 'workshop', 'upcoming', '2026-07-27', '08:00', '2026-07-25', 'Smashville Pickle', 'Indiranagar', 'Bangalore', 'Karnataka', 30, 11, null, null, 700, 0, false, 'beginner', 'Full refund up to 24 hours before.', true, 'Ace Pickleball Club', 4.7, 11, true);

-- ------------------------------------------------------------
-- 2. Typed timestamps (lifecycle scheduler from migration 002 compares these).
-- ------------------------------------------------------------
update public.events
set starts_at = (date || ' ' || time)::timestamptz,
    registration_closes_at = (registration_deadline || ' 23:59')::timestamptz
where starts_at is null
  and organizer_name in (
    'Mumbai Cricket League', 'Weekend Warriors Mumbai', 'TurfXI Sports Club',
    'Capital Hoops Delhi', 'Night Owls Hoops', 'Smash Badminton Academy',
    'Pro Kabaddi Federation', 'CyberArena Esports', 'Nexus Gaming Collective',
    'Coastline Volleyball Club', 'Deccan Chess Circle', 'SpinZone TT Club',
    'Ace Pickleball Club'
  );

-- ------------------------------------------------------------
-- 3. Prize breakdown for every seed event with a prize pool (50 / 30 / 20 split).
-- ------------------------------------------------------------
insert into public.event_prizes (event_id, position, label, amount)
select e.id, p.position, p.label, round(e.prize_pool * p.frac)
from public.events e
cross join (values (1, 'Winner', 0.50), (2, 'Runner-up', 0.30), (3, 'Second Runner-up', 0.20))
  as p(position, label, frac)
where e.prize_pool > 0
  and e.organizer_name in (
    'Mumbai Cricket League', 'Weekend Warriors Mumbai', 'TurfXI Sports Club',
    'Capital Hoops Delhi', 'Night Owls Hoops', 'Smash Badminton Academy',
    'Pro Kabaddi Federation', 'CyberArena Esports', 'Nexus Gaming Collective',
    'Coastline Volleyball Club', 'Deccan Chess Circle', 'SpinZone TT Club',
    'Ace Pickleball Club'
  );

-- ------------------------------------------------------------
-- 4. Rules shown on the event detail screen (applied to every seed event).
-- ------------------------------------------------------------
insert into public.event_rules (event_id, title, description, sort_order)
select e.id, r.title, r.description, r.sort_order
from public.events e
cross join (values
  ('Reporting Time', 'All participants must report at the venue 30 minutes before the scheduled start time.', 1),
  ('Valid ID', 'Carry a government-issued photo ID for verification at check-in.', 2),
  ('Fair Play', 'Any misconduct or use of unfair means leads to immediate disqualification without refund.', 3)
) as r(title, description, sort_order)
where e.organizer_name in (
    'Mumbai Cricket League', 'Weekend Warriors Mumbai', 'TurfXI Sports Club',
    'Capital Hoops Delhi', 'Night Owls Hoops', 'Smash Badminton Academy',
    'Pro Kabaddi Federation', 'CyberArena Esports', 'Nexus Gaming Collective',
    'Coastline Volleyball Club', 'Deccan Chess Circle', 'SpinZone TT Club',
    'Ace Pickleball Club'
  );

-- ------------------------------------------------------------
-- 5. Quick verification
-- ------------------------------------------------------------
select organizer_name, count(*) as events, sum(prize_pool) as total_prize, bool_or(organizer_verified) as verified
from public.events
group by organizer_name
order by organizer_name;
