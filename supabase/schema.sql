-- ============================================================
-- TOGO SPORTS PLATFORM — FULL SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for text search

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null,
  username        text unique,
  phone           text,
  avatar_url      text,
  city            text not null default 'Mumbai',
  bio             text not null default '',
  sports_interests text[] not null default '{}',
  wallet_balance  numeric(10,2) not null default 500,
  events_participated int not null default 0,
  events_won      int not null default 0,
  total_winnings  numeric(10,2) not null default 0,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id                      uuid primary key default uuid_generate_v4(),
  title                   text not null,
  description             text not null default '',
  category                text not null
    check (category in ('cricket','football','basketball','badminton','tennis','volleyball',
                        'kabaddi','table_tennis','swimming','athletics','esports','chess',
                        'pickleball','boxing','corporate','other')),
  event_type              text not null default 'tournament'
    check (event_type in ('tournament','casual','league','workshop')),
  status                  text not null default 'upcoming'
    check (status in ('upcoming','live','filling','sold_out','completed','cancelled')),
  date                    text not null,
  time                    text not null default '09:00',
  registration_deadline   text,
  venue_name              text not null,
  venue_address           text not null default '',
  city                    text not null,
  state                   text not null default 'Maharashtra',
  max_participants        int not null default 100,
  current_participants    int not null default 0,
  team_size_min           int,
  team_size_max           int,
  entry_fee               numeric(10,2) not null default 0,
  prize_pool              numeric(10,2) not null default 0,
  escrow_protected        boolean not null default true,
  skill_level             text not null default 'all'
    check (skill_level in ('beginner','intermediate','advanced','pro','all')),
  organizer_id            uuid references public.profiles(id) on delete set null,
  organizer_name          text not null default 'Togo Sports',
  organizer_events_hosted int not null default 0,
  organizer_rating        numeric(3,1) not null default 4.5,
  organizer_verified      boolean not null default false,
  equipment_provided      boolean not null default false,
  refund_policy           text not null default 'No refunds after registration.',
  banner_image_url        text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ============================================================
-- EVENT PRIZES
-- ============================================================
create table public.event_prizes (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  position    int not null,
  label       text not null,
  amount      numeric(10,2) not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- EVENT RULES
-- ============================================================
create table public.event_rules (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  title       text not null,
  description text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TICKETS (registrations)
-- ============================================================
create table public.tickets (
  id                   uuid primary key default uuid_generate_v4(),
  event_id             uuid not null references public.events(id) on delete cascade,
  user_id              uuid not null references public.profiles(id) on delete cascade,
  ticket_number        text not null unique,
  status               text not null default 'upcoming'
    check (status in ('upcoming','completed','cancelled')),
  amount_paid          numeric(10,2) not null default 0,
  participant_name     text not null,
  team_name            text,
  payment_method       text not null default 'wallet'
    check (payment_method in ('wallet','upi','card','razorpay')),
  razorpay_payment_id  text,
  razorpay_order_id    text,
  registered_at        timestamptz not null default now(),
  cancelled_at         timestamptz,
  created_at           timestamptz not null default now()
);

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
create table public.wallet_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      numeric(10,2) not null,
  type        text not null check (type in ('credit','debit')),
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LIVE MATCHES
-- ============================================================
create table public.live_matches (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid references public.events(id) on delete set null,
  title       text not null,
  team_a      text not null,
  team_b      text not null,
  score_a     text not null default '0',
  score_b     text not null default '0',
  status      text not null default 'live',
  prize_pool  numeric(10,2) not null default 0,
  viewers     int not null default 0,
  emoji       text not null default '🏏',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- LIVE MATCH UPDATES
-- ============================================================
create table public.live_match_updates (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid not null references public.live_matches(id) on delete cascade,
  time_label  text not null,
  text        text not null,
  update_type text not null default 'info'
    check (update_type in ('goal','wicket','point','info')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CORPORATE PACKAGES
-- ============================================================
create table public.corporate_packages (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  price        numeric(10,2) not null,
  participants text not null,
  duration     text not null,
  sports       text[] not null default '{}',
  includes     text[] not null default '{}',
  popular      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- STORAGE: sport-images bucket
-- ============================================================
insert into storage.buckets (id, name, public) values ('sport-images', 'sport-images', true)
on conflict do nothing;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict do nothing;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists events_category_idx on public.events(category);
create index if not exists events_status_idx   on public.events(status);
create index if not exists events_city_idx     on public.events(city);
create index if not exists events_date_idx     on public.events(date);
create index if not exists tickets_user_id_idx on public.tickets(user_id);
create index if not exists tickets_event_id_idx on public.tickets(event_id);

-- Full-text search on events
create index if not exists events_search_idx
  on public.events using gin(to_tsvector('english', title || ' ' || city));

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger events_updated_at   before update on public.events   for each row execute function handle_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function handle_updated_at();
create trigger matches_updated_at  before update on public.live_matches for each row execute function handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, city)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Togo Player'), 'Mumbai')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INCREMENT EVENT PARTICIPANTS (called after ticket creation)
-- ============================================================
create or replace function public.increment_event_participants(event_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.events
  set current_participants = current_participants + 1,
      status = case
        when current_participants + 1 >= max_participants then 'sold_out'
        when (current_participants + 1)::float / max_participants >= 0.85 then 'filling'
        else status
      end
  where id = event_id;
end; $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.events              enable row level security;
alter table public.event_prizes        enable row level security;
alter table public.event_rules         enable row level security;
alter table public.tickets             enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.live_matches        enable row level security;
alter table public.live_match_updates  enable row level security;
alter table public.corporate_packages  enable row level security;

-- profiles: own row + public read
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_own_write"    on public.profiles for all    using (auth.uid() = id);

-- events: public read, organizer write
create policy "events_public_read"    on public.events for select using (true);
create policy "events_organizer_write" on public.events for all   using (auth.uid() = organizer_id);

-- event_prizes + rules: public read
create policy "prizes_public_read"    on public.event_prizes for select using (true);
create policy "rules_public_read"     on public.event_rules  for select using (true);

-- tickets: own only
create policy "tickets_own"           on public.tickets for all using (auth.uid() = user_id);

-- wallet: own only
create policy "wallet_own"            on public.wallet_transactions for all using (auth.uid() = user_id);

-- live matches + updates: public read
create policy "live_matches_read"     on public.live_matches      for select using (true);
create policy "live_updates_read"     on public.live_match_updates for select using (true);

-- corporate: public read
create policy "corporate_read"        on public.corporate_packages for select using (true);

-- storage policies
create policy "avatars_public"        on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_upload"        on storage.objects for insert using (bucket_id = 'avatars' and auth.uid() is not null);
create policy "sport_images_public"   on storage.objects for select using (bucket_id = 'sport-images');
