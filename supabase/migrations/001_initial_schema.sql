-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               UUID REFERENCES auth.users PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  username         TEXT UNIQUE,
  phone            TEXT,
  city             TEXT NOT NULL DEFAULT 'Mumbai',
  bio              TEXT NOT NULL DEFAULT '',
  avatar_url       TEXT,
  wallet_balance   NUMERIC(12,2) NOT NULL DEFAULT 0,
  events_participated INT NOT NULL DEFAULT 0,
  events_won       INT NOT NULL DEFAULT 0,
  total_winnings   NUMERIC(12,2) NOT NULL DEFAULT 0,
  sports_interests TEXT[] NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  level            INT NOT NULL DEFAULT 1,
  xp               INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by all authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
CREATE TABLE events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL,
  event_type            TEXT NOT NULL DEFAULT 'tournament',
  status                TEXT NOT NULL DEFAULT 'upcoming',
  date                  TEXT NOT NULL,
  time                  TEXT NOT NULL,
  registration_deadline TEXT,
  venue_name            TEXT NOT NULL,
  venue_address         TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT '',
  max_participants      INT NOT NULL DEFAULT 20,
  current_participants  INT NOT NULL DEFAULT 0,
  team_size_min         INT,
  team_size_max         INT,
  entry_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
  prize_pool            NUMERIC(10,2) NOT NULL DEFAULT 0,
  escrow_protected      BOOLEAN NOT NULL DEFAULT false,
  skill_level           TEXT NOT NULL DEFAULT 'all',
  refund_policy         TEXT NOT NULL DEFAULT '',
  equipment_provided    BOOLEAN NOT NULL DEFAULT false,
  organizer_id          UUID REFERENCES profiles(id),
  organizer_name        TEXT NOT NULL DEFAULT '',
  organizer_rating      NUMERIC(3,1) NOT NULL DEFAULT 4.5,
  organizer_events_hosted INT NOT NULL DEFAULT 0,
  organizer_verified    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all authenticated users"
  ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can create events"
  ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their events"
  ON events FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);

-- ─── EVENT PRIZES ─────────────────────────────────────────────────────────────
CREATE TABLE event_prizes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events ON DELETE CASCADE NOT NULL,
  position   INT NOT NULL,
  label      TEXT NOT NULL,
  amount     NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prize data viewable by all authenticated users"
  ON event_prizes FOR SELECT TO authenticated USING (true);

-- ─── EVENT RULES ──────────────────────────────────────────────────────────────
CREATE TABLE event_rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rules viewable by all authenticated users"
  ON event_rules FOR SELECT TO authenticated USING (true);

-- ─── TICKETS ──────────────────────────────────────────────────────────────────
CREATE TABLE tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES events NOT NULL,
  user_id             UUID REFERENCES profiles NOT NULL,
  ticket_number       TEXT UNIQUE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'upcoming',
  amount_paid         NUMERIC(10,2) NOT NULL DEFAULT 0,
  participant_name    TEXT NOT NULL,
  team_name           TEXT,
  payment_method      TEXT NOT NULL DEFAULT 'wallet',
  razorpay_payment_id TEXT,
  razorpay_order_id   TEXT,
  registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at        TIMESTAMPTZ
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets for themselves"
  ON tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tickets"
  ON tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ─── LIVE MATCHES ─────────────────────────────────────────────────────────────
CREATE TABLE live_matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events,
  title      TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '🏆',
  status     TEXT NOT NULL DEFAULT 'In Progress',
  team_a     TEXT NOT NULL,
  team_b     TEXT NOT NULL,
  score_a    TEXT NOT NULL DEFAULT '0',
  score_b    TEXT NOT NULL DEFAULT '0',
  prize_pool NUMERIC(10,2) NOT NULL DEFAULT 0,
  viewers    INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live matches viewable by all authenticated users"
  ON live_matches FOR SELECT TO authenticated USING (true);

-- ─── LIVE MATCH UPDATES ───────────────────────────────────────────────────────
CREATE TABLE live_match_updates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   UUID REFERENCES live_matches ON DELETE CASCADE NOT NULL,
  time_label TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_match_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live updates viewable by all authenticated users"
  ON live_match_updates FOR SELECT TO authenticated USING (true);

-- ─── CORPORATE PACKAGES ───────────────────────────────────────────────────────
CREATE TABLE corporate_packages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  participants TEXT NOT NULL,
  duration     TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  sports       TEXT[] NOT NULL DEFAULT '{}',
  includes     TEXT[] NOT NULL DEFAULT '{}',
  popular      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE corporate_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Corporate packages viewable by all authenticated users"
  ON corporate_packages FOR SELECT TO authenticated USING (true);

-- ─── CORPORATE ENQUIRIES ──────────────────────────────────────────────────────
CREATE TABLE corporate_enquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id     UUID REFERENCES corporate_packages NOT NULL,
  company_name   TEXT NOT NULL,
  contact_name   TEXT NOT NULL,
  contact_phone  TEXT NOT NULL,
  employee_count TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE corporate_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit corporate enquiries"
  ON corporate_enquiries FOR INSERT TO authenticated WITH CHECK (true);

-- ─── PLAYER PROFILES ──────────────────────────────────────────────────────────
CREATE TABLE player_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  name         TEXT NOT NULL,
  sport        TEXT NOT NULL,
  skill_level  TEXT NOT NULL DEFAULT 'beginner',
  city         TEXT NOT NULL,
  rating       NUMERIC(3,1) NOT NULL DEFAULT 4.0,
  events_count INT NOT NULL DEFAULT 0,
  looking_for  TEXT NOT NULL DEFAULT '',
  available    TEXT NOT NULL DEFAULT 'Weekends',
  verified     BOOLEAN NOT NULL DEFAULT false,
  visible      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player profiles viewable by all authenticated users"
  ON player_profiles FOR SELECT TO authenticated USING (visible = true);
CREATE POLICY "Users can manage their player profile"
  ON player_profiles FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ─── WALLET TRANSACTIONS ──────────────────────────────────────────────────────
CREATE TABLE wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  reference_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions"
  ON wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions"
  ON wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── HELPER FUNCTION ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_event_participants(event_id UUID)
RETURNS void AS $$
  UPDATE events SET current_participants = current_participants + 1 WHERE id = event_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE live_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE live_match_updates;
