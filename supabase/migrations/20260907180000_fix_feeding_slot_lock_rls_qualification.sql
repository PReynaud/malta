-- Fix open feeding-slot RLS: bare `feed_date` in the lock subquery bound to
-- locked_feed_dates.feed_date (tautology), so any lock blocked all anon writes.

drop policy if exists "Anyone can insert open feeding slots" on public.feeding_slots;
drop policy if exists "Anyone can delete open feeding slots" on public.feeding_slots;

create policy "Anyone can insert open feeding slots"
  on public.feeding_slots
  for insert
  to anon, authenticated
  with check (
    feed_date >= (timezone('Europe/Paris', now()))::date
    and not exists (
      select 1
      from public.locked_feed_dates as locked
      where locked.feed_date = feeding_slots.feed_date
    )
  );

create policy "Anyone can delete open feeding slots"
  on public.feeding_slots
  for delete
  to anon, authenticated
  using (
    feed_date >= (timezone('Europe/Paris', now()))::date
    and not exists (
      select 1
      from public.locked_feed_dates as locked
      where locked.feed_date = feeding_slots.feed_date
    )
  );
