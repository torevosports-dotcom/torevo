-- ─── CORPORATE PACKAGES ───────────────────────────────────────────────────────
INSERT INTO corporate_packages (name, participants, duration, price, sports, includes, popular) VALUES
(
  'Starter Day',
  '20–40 employees',
  '1 full day',
  24999,
  ARRAY['Football', 'Cricket', 'Badminton'],
  ARRAY[
    'Venue booking & setup', 'Professional referee', 'Equipment & kits',
    'Snacks & refreshments', 'Digital scoreboard', 'Certificate of participation',
    'Event photographer', 'WhatsApp group coordination'
  ],
  false
),
(
  'Team League',
  '40–100 employees',
  '4 weeks',
  59999,
  ARRAY['Cricket', 'Football', 'Volleyball', 'Badminton', 'Table Tennis'],
  ARRAY[
    'Everything in Starter Day',
    'Weekly matches (4 rounds)', 'Points table & live leaderboard',
    'Trophy & medals for top 3 teams', 'Dedicated event manager',
    'Custom jersey printing (optional add-on)', 'Highlights video reel',
    'Nutritionist talk session', 'Team-building workshop',
    'Escrow-protected prize pool'
  ],
  true
),
(
  'Premier Sports Carnival',
  '100–200 employees',
  '8 weeks',
  129999,
  ARRAY['Cricket', 'Football', 'Basketball', 'Volleyball', 'Kabaddi', 'Badminton'],
  ARRAY[
    'Everything in Team League',
    'Multi-sport knockout tournament', 'Premium venue & hospitality',
    'Professional commentary & PA system', 'Live streaming for remote employees',
    'Custom trophies & medals for all sports', 'Physiotherapist on-site',
    'Full event branding & banners', 'Post-event analytics report',
    'CEO vs Employees challenge match', 'Sports day certificate for all'
  ],
  false
);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
-- Cricket Tournament
INSERT INTO events (
  title, description, category, event_type, status,
  date, time, registration_deadline,
  venue_name, venue_address, city, state,
  max_participants, current_participants,
  entry_fee, prize_pool, escrow_protected,
  skill_level, refund_policy, equipment_provided,
  organizer_name, organizer_rating, organizer_events_hosted, organizer_verified
) VALUES (
  'Mumbai Premier Cricket League – Season 5',
  'The biggest amateur cricket league in Mumbai returns for its 5th season. 20-over format, professional-grade pitches, DRS technology, and escrow-protected prize pools. Open to teams of 11. Both batting and bowling skills put to test in 3 group-stage matches guaranteed.',
  'cricket', 'league', 'filling',
  '2026-07-15', '7:00 AM', '2026-07-10',
  'Shivaji Park Cricket Ground', 'Shivaji Park, Dadar West', 'Mumbai', 'Maharashtra',
  120, 96,
  1499, 50000, true,
  'intermediate',
  'Full refund if event is cancelled by organizer. 50% refund for cancellations 48+ hours before start. No refund within 48 hours.',
  true,
  'Mumbai Sports Club', 4.8, 34, true
),
-- Football 5s
(
  'Powai 5-a-Side Football Cup',
  'Fast-paced 5-a-side football tournament on synthetic turf. 3 group stage matches guaranteed. Semi-finals and finals on Day 2. Register as a team of 5-7 players. Goalkeeping gloves and bibs provided.',
  'football', 'tournament', 'upcoming',
  '2026-07-20', '3:00 PM', '2026-07-17',
  'Kohinoor Synthetic Turf', 'IIT Powai Area, Powai', 'Mumbai', 'Maharashtra',
  48, 12,
  599, 15000, true,
  'all',
  'Full refund if cancelled. 50% refund 24+ hours before event.',
  true,
  'Powai FC', 4.6, 18, true
),
-- Badminton
(
  'All-India Badminton Open – Doubles',
  'Open badminton doubles tournament. Knockout format with consolation bracket. Players of all skill levels welcome. Shuttle cocks and court bookings included. Professional stringing service available on-site.',
  'badminton', 'tournament', 'upcoming',
  '2026-07-26', '9:00 AM', '2026-07-22',
  'Sports Authority of India Complex', 'NSC Complex, Andheri East', 'Mumbai', 'Maharashtra',
  64, 28,
  799, 20000, true,
  'intermediate',
  'Full refund for cancellations 72+ hours before start. No refund thereafter.',
  false,
  'Shuttle India Events', 4.7, 22, true
),
-- Kabaddi
(
  'Thane Kabaddi Championship 2026',
  'Traditional kabaddi tournament celebrating the sport at the grassroots level. Teams of 12 players (7 on mat). Round-robin format for group stage followed by knockouts. Medals for top 3 teams.',
  'kabaddi', 'tournament', 'upcoming',
  '2026-08-02', '8:00 AM', '2026-07-28',
  'Thane Municipal Stadium', 'Ghantali, Thane West', 'Thane', 'Maharashtra',
  96, 24,
  399, 10000, true,
  'all',
  'Full refund if event is cancelled. No player-initiated refunds.',
  false,
  'Maharashtra Kabaddi Sangh', 4.5, 12, false
),
-- Esports
(
  'BGMI Solo Ranked Tournament',
  'Competitive BGMI solo tournament for ranked players. All matches on TDM and Classic modes. Anti-cheat verified matches. Prize distributed directly to your in-game ID via BGMI official channel. Minimum rank requirement: Platinum III.',
  'esports', 'tournament', 'upcoming',
  '2026-07-18', '6:00 PM', '2026-07-16',
  'Online – Discord Server', 'Join via Discord: togo.gg/bgmi', 'Online', 'Pan India',
  200, 87,
  249, 25000, true,
  'advanced',
  'No refunds for disqualification. Full refund if event cancelled.',
  false,
  'Togo Esports', 4.9, 45, true
),
-- Basketball
(
  '3x3 Street Basketball – Bandra Edition',
  '3-on-3 basketball played on the iconic Bandra court. Casual but competitive. All baskets worth 1 point except 2-pointers from the arc. First team to 21 or leading at 10 minutes wins. Sneaker-friendly surface.',
  'basketball', 'casual', 'upcoming',
  '2026-07-27', '5:00 PM', '2026-07-25',
  'Mount Mary Road Basketball Court', 'Bandra West', 'Mumbai', 'Maharashtra',
  40, 8,
  299, 5000, false,
  'beginner',
  'Full refund if event is cancelled.',
  false,
  'Bandra Ballers', 4.4, 9, false
),
-- Live event
(
  'Pune Premier Cricket – Live Quarter Finals',
  'Live quarter-final matches of the Pune Premier Cricket League Season 3. Come watch or follow the live scores on the app.',
  'cricket', 'league', 'live',
  '2026-06-07', '10:00 AM', NULL,
  'Deccan Gymkhana Ground', 'Deccan Gymkhana, Pune', 'Pune', 'Maharashtra',
  88, 88,
  0, 100000, true,
  'advanced', '', true,
  'Pune Cricket Association', 4.9, 67, true
),
-- Volleyball
(
  'Beach Volleyball Open – Juhu',
  'India''s premier beach volleyball tournament at the iconic Juhu beach. Teams of 2. Round-robin format. Sunscreen and snacks provided. Beach-ready fun for competitive players.',
  'volleyball', 'tournament', 'upcoming',
  '2026-08-10', '7:00 AM', '2026-08-05',
  'Juhu Beach Volleyball Court', 'Juhu Tara Road, Juhu', 'Mumbai', 'Maharashtra',
  32, 6,
  899, 30000, true,
  'intermediate',
  '100% refund if event is cancelled due to rain or organizer. No refunds within 72 hours.',
  false,
  'Beach Sports India', 4.7, 15, true
);

-- ─── EVENT PRIZES ─────────────────────────────────────────────────────────────
-- Cricket League prizes
WITH ev AS (SELECT id FROM events WHERE title LIKE 'Mumbai Premier Cricket%' LIMIT 1)
INSERT INTO event_prizes (event_id, position, label, amount, description)
SELECT ev.id, 1, '1st Place', 25000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 2, '2nd Place', 15000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 3, '3rd Place', 7000, 'Medal + Cash' FROM ev
UNION ALL
SELECT ev.id, 4, 'Best Batsman', 2000, 'Cash + Trophy' FROM ev
UNION ALL
SELECT ev.id, 5, 'Best Bowler', 1000, 'Cash + Trophy' FROM ev;

-- Football prizes
WITH ev AS (SELECT id FROM events WHERE title LIKE 'Powai 5-a-Side%' LIMIT 1)
INSERT INTO event_prizes (event_id, position, label, amount, description)
SELECT ev.id, 1, '1st Place', 8000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 2, '2nd Place', 5000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 3, '3rd Place', 2000, 'Medal' FROM ev;

-- Badminton prizes
WITH ev AS (SELECT id FROM events WHERE title LIKE 'All-India Badminton%' LIMIT 1)
INSERT INTO event_prizes (event_id, position, label, amount, description)
SELECT ev.id, 1, '1st Place', 10000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 2, '2nd Place', 6000, 'Trophy + Cash' FROM ev
UNION ALL
SELECT ev.id, 3, '3rd Place', 2500, 'Medal + Cash' FROM ev
UNION ALL
SELECT ev.id, 4, 'Best Pair', 1500, 'Special Award' FROM ev;

-- Esports prizes
WITH ev AS (SELECT id FROM events WHERE title LIKE 'BGMI Solo%' LIMIT 1)
INSERT INTO event_prizes (event_id, position, label, amount, description)
SELECT ev.id, 1, '1st Place', 10000, 'Direct in-game transfer' FROM ev
UNION ALL
SELECT ev.id, 2, '2nd Place', 7000, 'Direct in-game transfer' FROM ev
UNION ALL
SELECT ev.id, 3, '3rd Place', 5000, 'Direct in-game transfer' FROM ev
UNION ALL
SELECT ev.id, 4, '4th–10th Place', 3000, 'Split equally' FROM ev;

-- ─── EVENT RULES ──────────────────────────────────────────────────────────────
WITH ev AS (SELECT id FROM events WHERE title LIKE 'Mumbai Premier Cricket%' LIMIT 1)
INSERT INTO event_rules (event_id, title, description, sort_order)
SELECT ev.id, 'Team Composition', 'Each team must have exactly 11 players. Up to 3 substitutes allowed per team.', 1 FROM ev
UNION ALL
SELECT ev.id, 'Equipment', 'White cricket whites required. Togo-branded jerseys available for purchase on-site.', 2 FROM ev
UNION ALL
SELECT ev.id, 'Match Format', '20 overs per side. Power play: overs 1-6. Death overs: 16-20.', 3 FROM ev
UNION ALL
SELECT ev.id, 'Fair Play', 'Professional conduct expected. Umpire decisions are final. Disputes handled by match referee.', 4 FROM ev;

-- ─── LIVE MATCHES ─────────────────────────────────────────────────────────────
WITH ev AS (SELECT id FROM events WHERE status = 'live' LIMIT 1)
INSERT INTO live_matches (event_id, title, emoji, status, team_a, team_b, score_a, score_b, prize_pool, viewers)
SELECT ev.id, 'Pune Strikers vs Mumbai Tigers – QF 1', '🏏', '14.3 Overs | QF 1', 'Pune Strikers', 'Mumbai Tigers', '156/4', '89/3 (14.3)', 100000, 4821 FROM ev;

WITH ev AS (SELECT id FROM events WHERE status = 'live' LIMIT 1)
INSERT INTO live_matches (event_id, title, emoji, status, team_a, team_b, score_a, score_b, prize_pool, viewers)
SELECT ev.id, 'Bandra Bullets vs Andheri Aces – QF 2', '🏏', '8.1 Overs | QF 2', 'Bandra Bullets', 'Andheri Aces', '180/8 (20)', '62/2 (8.1)', 100000, 2340 FROM ev;

-- Live match updates
WITH m AS (SELECT id FROM live_matches WHERE title LIKE 'Pune Strikers%' LIMIT 1)
INSERT INTO live_match_updates (match_id, time_label, text)
SELECT m.id, '14.3', 'WICKET! Rohit Patil caught behind off Sharma for 42. Mumbai Tigers need 68 off 34 balls.' FROM m
UNION ALL
SELECT m.id, '12.0', 'SIX! Mehta launches Kulkarni over long-on. What a shot!' FROM m
UNION ALL
SELECT m.id, '10.0', 'End of 10 overs. Mumbai Tigers 61/2 (RRR: 9.5). Mehta 28*, Singh 4*.' FROM m
UNION ALL
SELECT m.id, '6.0', 'End of power play. Mumbai Tigers 42/2. Tight start by Pune bowlers.' FROM m;

WITH m AS (SELECT id FROM live_matches WHERE title LIKE 'Bandra Bullets%' LIMIT 1)
INSERT INTO live_match_updates (match_id, time_label, text)
SELECT m.id, '8.1', 'Bandra target: 181. Andheri off to a flier – 62 runs in 8 overs, 2 wickets down.' FROM m
UNION ALL
SELECT m.id, '20.0', 'Innings break! Bandra Bullets post 180/8 (20). Top score: Javed Khan 74 off 52.' FROM m
UNION ALL
SELECT m.id, '15.0', 'FOUR! Boundary off the last ball of over 15. Bandra 128/6.' FROM m;

-- ─── PLAYER PROFILES ──────────────────────────────────────────────────────────
INSERT INTO player_profiles (name, sport, skill_level, city, rating, events_count, looking_for, available, verified) VALUES
('Arjun Mehta', 'cricket', 'advanced', 'Mumbai', 4.8, 23, 'Looking for a competitive cricket team for weekend league play. Specialist: opening batsman.', 'Weekends, some evenings', true),
('Priya Sharma', 'badminton', 'intermediate', 'Bangalore', 4.6, 15, 'Seeking doubles partner for upcoming tournaments. Left-handed player. Flexible on schedule.', 'Weekday evenings, Sundays', true),
('Karan Singh', 'football', 'pro', 'Delhi', 4.9, 41, 'Semi-pro 5-a-side striker available for competitive leagues. Former Santosh Trophy participant.', 'Weekends', true),
('Sneha Patel', 'kabaddi', 'intermediate', 'Pune', 4.3, 8, 'Women''s kabaddi player looking for team. Raider. Trained at district level.', 'Weekdays post 6 PM, Saturdays', false),
('Rohan Das', 'basketball', 'advanced', 'Mumbai', 4.7, 19, '3x3 basketball fanatic. Looking for teammates for street basketball and tournaments. PG position.', 'Evening daily', true),
('Amit Verma', 'esports', 'pro', 'Hyderabad', 5.0, 62, 'BGMI Conqueror rank player. Available for team scrims and tournaments. Also coaches beginners.', 'Flexible – remote', true),
('Divya Nair', 'volleyball', 'intermediate', 'Chennai', 4.4, 11, 'Setter looking for beach volleyball partner. Previously played for college team.', 'Weekends', false),
('Mohit Gupta', 'cricket', 'beginner', 'Mumbai', 3.9, 4, 'New to organised cricket. Looking for a friendly team to practice and learn. Medium-pace bowler.', 'Sunday mornings', false),
('Aisha Khan', 'badminton', 'advanced', 'Mumbai', 4.8, 31, 'Former state-level player returning to competitive badminton. All India ranking: 84 (Women''s doubles).', 'Mornings and evenings', true),
('Vikas Reddy', 'football', 'intermediate', 'Bangalore', 4.5, 14, 'Central midfielder with good vision. Looking for 7-a-side or 11-a-side club team for Saturday league.', 'Saturday and Sunday', false);
