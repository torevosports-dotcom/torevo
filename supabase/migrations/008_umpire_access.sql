-- ============================================================
-- 008_umpire_access.sql
-- Togo — let the match UMPIRE (assigned by the organizer) upload scores live,
-- not only the organizer. One can_score() rule, reused by every scoring table.
-- Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Organizer assigns an umpire. umpire_id once they have an account; umpire_phone
-- holds the number until then (auto-linked on signup — see app authStore).
alter table public.events
  add column if not exists umpire_id    uuid references public.profiles(id) on delete set null,
  add column if not exists umpire_phone text;

-- Single source of truth: who may score this event.
create or replace function public.can_score(p_event uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event
      and (e.organizer_id = auth.uid() or e.umpire_id = auth.uid())
  );
$$;
grant execute on function public.can_score(uuid) to authenticated, anon;

-- ── Re-point every scoring write policy at can_score(event) ──

drop policy if exists "organizer writes live matches" on public.live_matches;
create policy "scorer writes live matches" on public.live_matches
  for all to authenticated
  using (public.can_score(event_id)) with check (public.can_score(event_id));

drop policy if exists "organizer writes updates" on public.live_match_updates;
create policy "scorer writes updates" on public.live_match_updates
  for all to authenticated
  using (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)))
  with check (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)));

drop policy if exists "organizer writes match players" on public.match_players;
create policy "scorer writes match players" on public.match_players
  for all to authenticated
  using (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)))
  with check (exists (select 1 from public.live_matches lm where lm.id = match_id and public.can_score(lm.event_id)));

drop policy if exists "organizer writes cricket matches" on public.cricket_matches;
create policy "scorer writes cricket matches" on public.cricket_matches
  for all to authenticated
  using (public.can_score(event_id)) with check (public.can_score(event_id));

drop policy if exists "organizer writes cricket balls" on public.cricket_balls;
create policy "scorer writes cricket balls" on public.cricket_balls
  for all to authenticated
  using (exists (select 1 from public.cricket_matches cm where cm.id = cmatch_id and public.can_score(cm.event_id)))
  with check (exists (select 1 from public.cricket_matches cm where cm.id = cmatch_id and public.can_score(cm.event_id)));
