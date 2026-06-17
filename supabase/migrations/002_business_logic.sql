-- ============================================================
-- 002_business_logic.sql
-- Togo — atomic registration, event lifecycle scheduler, escrow engine
-- Apply in Supabase SQL Editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Typed timestamp columns (date/time/deadline are TEXT today)
--    The lifecycle scheduler needs real timestamptz to compare.
-- ------------------------------------------------------------
alter table public.events
  add column if not exists starts_at timestamptz,
  add column if not exists registration_closes_at timestamptz;

-- Best-effort backfill from existing text columns.
-- Adjust the format string if your seed data uses a different layout.
update public.events
set starts_at = coalesce(
      starts_at,
      nullif(date,'')::timestamptz,
      to_timestamp(date || ' ' || coalesce(nullif(time,''),'09:00'),
                   'YYYY-MM-DD HH24:MI') )
where starts_at is null;

update public.events
set registration_closes_at = coalesce(
      registration_closes_at,
      nullif(registration_deadline,'')::timestamptz,
      starts_at)
where registration_closes_at is null;

-- ------------------------------------------------------------
-- 1. Integrity constraints
-- ------------------------------------------------------------
-- Never let participant count exceed capacity.
alter table public.events
  drop constraint if exists events_capacity_chk;
alter table public.events
  add constraint events_capacity_chk
  check (current_participants <= max_participants);

-- One active ticket per (event, user). Cancelled tickets are excluded
-- so a user can re-register after cancelling.
create unique index if not exists tickets_one_per_user_event
  on public.tickets (event_id, user_id)
  where status <> 'cancelled';

-- ------------------------------------------------------------
-- 2. Escrow ledger
-- ------------------------------------------------------------
create table if not exists public.escrow_holdings (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      numeric(10,2) not null,
  status      text not null default 'held'
              check (status in ('held','released','refunded')),
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);

alter table public.escrow_holdings enable row level security;

drop policy if exists "escrow read own" on public.escrow_holdings;
create policy "escrow read own" on public.escrow_holdings
  for select using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. ATOMIC REGISTRATION
--    capacity + duplicate + wallet debit + ticket + count + escrow hold
--    all in ONE transaction. Returns the new ticket id.
-- ------------------------------------------------------------
create or replace function public.register_for_event(
  p_event_id        uuid,
  p_participant_name text,
  p_team_name        text default null,
  p_payment_method   text default 'wallet',
  p_razorpay_payment_id text default null,
  p_razorpay_order_id   text default null
) returns uuid
language plpgsql security definer as $$
declare
  v_user    uuid := auth.uid();
  v_event   public.events%rowtype;
  v_ticket  uuid;
  v_fee     numeric(10,2);
  v_balance numeric(10,2);
  v_ticket_no text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the event row so concurrent registrations serialize here.
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Event not found';
  end if;

  if v_event.status in ('completed','cancelled') then
    raise exception 'Event is no longer open';
  end if;

  if v_event.registration_closes_at is not null
     and now() > v_event.registration_closes_at then
    raise exception 'Registration is closed';
  end if;

  if v_event.current_participants >= v_event.max_participants then
    raise exception 'Event is sold out';
  end if;

  -- Duplicate guard
  if exists (
    select 1 from public.tickets
    where event_id = p_event_id and user_id = v_user and status <> 'cancelled'
  ) then
    raise exception 'Already registered';
  end if;

  v_fee := v_event.entry_fee;

  -- Wallet payment: debit atomically
  if p_payment_method = 'wallet' and v_fee > 0 then
    select wallet_balance into v_balance from public.profiles
      where id = v_user for update;
    if v_balance < v_fee then
      raise exception 'Insufficient wallet balance';
    end if;
    update public.profiles set wallet_balance = wallet_balance - v_fee
      where id = v_user;
    insert into public.wallet_transactions (user_id, amount, type, description, reference_id)
      values (v_user, v_fee, 'debit', 'Event registration: ' || v_event.title, p_event_id);
  end if;

  v_ticket_no := 'TGO-' || to_char(now(),'YYYYMM') || '-' ||
                 lpad((floor(random()*90000)+10000)::text, 5, '0');

  insert into public.tickets
    (event_id, user_id, ticket_number, status, amount_paid,
     participant_name, team_name, payment_method,
     razorpay_payment_id, razorpay_order_id)
  values
    (p_event_id, v_user, v_ticket_no, 'upcoming', v_fee,
     p_participant_name, p_team_name, p_payment_method,
     p_razorpay_payment_id, p_razorpay_order_id)
  returning id into v_ticket;

  update public.events
  set current_participants = current_participants + 1,
      status = case
        when current_participants + 1 >= max_participants then 'sold_out'
        when (current_participants + 1)::float / max_participants >= 0.85 then 'filling'
        else status
      end
  where id = p_event_id;

  -- Escrow: hold the fee until the event completes
  if v_event.escrow_protected and v_fee > 0 then
    insert into public.escrow_holdings (event_id, ticket_id, user_id, amount, status)
      values (p_event_id, v_ticket, v_user, v_fee, 'held');
  end if;

  update public.profiles set events_participated = events_participated + 1
    where id = v_user;

  return v_ticket;
end; $$;

-- ------------------------------------------------------------
-- 4. CANCELLATION + REFUND
-- ------------------------------------------------------------
create or replace function public.cancel_ticket(p_ticket_id uuid)
returns void language plpgsql security definer as $$
declare
  v_user  uuid := auth.uid();
  v_tkt   public.tickets%rowtype;
begin
  select * into v_tkt from public.tickets where id = p_ticket_id for update;
  if not found or v_tkt.user_id <> v_user then
    raise exception 'Ticket not found';
  end if;
  if v_tkt.status = 'cancelled' then return; end if;

  update public.tickets set status = 'cancelled', cancelled_at = now()
    where id = p_ticket_id;
  update public.events set current_participants = greatest(0, current_participants - 1)
    where id = v_tkt.event_id;

  -- Refund any held escrow back to the wallet
  update public.escrow_holdings set status = 'refunded', settled_at = now()
    where ticket_id = p_ticket_id and status = 'held';
  if v_tkt.amount_paid > 0 then
    update public.profiles set wallet_balance = wallet_balance + v_tkt.amount_paid
      where id = v_user;
    insert into public.wallet_transactions (user_id, amount, type, description, reference_id)
      values (v_user, v_tkt.amount_paid, 'credit', 'Refund: cancelled registration', v_tkt.event_id);
  end if;
end; $$;

-- ------------------------------------------------------------
-- 5. EVENT LIFECYCLE SCHEDULER
--    Promotes statuses by time and releases escrow on completion.
--    Run on a schedule (pg_cron below) — or call manually to test.
-- ------------------------------------------------------------
create or replace function public.process_event_lifecycle()
returns void language plpgsql security definer as $$
begin
  -- upcoming/filling/sold_out → live once start time passes
  update public.events
  set status = 'live'
  where status in ('upcoming','filling','sold_out')
    and starts_at is not null
    and now() >= starts_at;

  -- live → completed ~3h after start (tournament window; tune as needed)
  update public.events
  set status = 'completed'
  where status = 'live'
    and starts_at is not null
    and now() >= starts_at + interval '3 hours';

  -- Release escrow to organizers for completed events
  update public.escrow_holdings e
  set status = 'released', settled_at = now()
  from public.events ev
  where e.event_id = ev.id
    and ev.status = 'completed'
    and e.status = 'held';
end; $$;

-- Schedule every 5 minutes (requires the pg_cron extension).
-- In Supabase: Dashboard → Database → Extensions → enable "pg_cron".
create extension if not exists pg_cron;
select cron.unschedule('togo-event-lifecycle')
  where exists (select 1 from cron.job where jobname = 'togo-event-lifecycle');
select cron.schedule('togo-event-lifecycle', '*/5 * * * *',
  $$ select public.process_event_lifecycle(); $$);

-- ------------------------------------------------------------
-- 6. Grants (RPCs callable by the anon/authenticated roles)
-- ------------------------------------------------------------
grant execute on function public.register_for_event(uuid,text,text,text,text,text) to authenticated, anon;
grant execute on function public.cancel_ticket(uuid)                                to authenticated, anon;
grant execute on function public.process_event_lifecycle()                          to authenticated, anon;
