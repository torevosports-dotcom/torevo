-- ============================================================
-- 011_team_registration.sql
-- Togo — team rosters: the captain's ticket carries every teammate's
-- phone number. Editable by the captain until the event ends. Stats key
-- off the phone-linked players directory.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.ticket_members (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  name       text not null,
  phone      text,
  player_id  uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_members_ticket_idx on public.ticket_members (ticket_id);

alter table public.ticket_members enable row level security;

-- Anyone signed in can read a roster (hosts/umpires need it for scoring).
drop policy if exists "ticket members readable" on public.ticket_members;
create policy "ticket members readable" on public.ticket_members
  for select to authenticated using (true);

-- The ticket owner (captain) manages members — only while the event is still open.
drop policy if exists "owner writes ticket members" on public.ticket_members;
create policy "owner writes ticket members" on public.ticket_members
  for all to authenticated
  using (exists (
    select 1 from public.tickets t join public.events e on e.id = t.event_id
    where t.id = ticket_members.ticket_id and t.user_id = auth.uid()
      and e.status not in ('completed','cancelled')
  ))
  with check (exists (
    select 1 from public.tickets t join public.events e on e.id = t.event_id
    where t.id = ticket_members.ticket_id and t.user_id = auth.uid()
      and e.status not in ('completed','cancelled')
  ));
