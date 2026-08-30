-- Admin can lock feeding days so volunteers cannot change availability.

create table public.locked_feed_dates (
  feed_date date primary key,
  locked_at timestamptz not null default now(),
  constraint locked_feed_dates_september_2026 check (
    feed_date >= date '2026-09-01' and feed_date <= date '2026-09-30'
  )
);

alter table public.locked_feed_dates enable row level security;

create policy "Anyone can read locked feed dates"
  on public.locked_feed_dates
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert locked feed dates"
  on public.locked_feed_dates
  for insert
  to authenticated
  with check ((select public.is_malta_admin()));

create policy "Admins can delete locked feed dates"
  on public.locked_feed_dates
  for delete
  to authenticated
  using ((select public.is_malta_admin()));

grant select on table public.locked_feed_dates to anon, authenticated;
grant insert, delete on table public.locked_feed_dates to authenticated;

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
      where locked.feed_date = feed_date
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
      where locked.feed_date = feed_date
    )
  );

create policy "Admins can delete feeding slots"
  on public.feeding_slots
  for delete
  to authenticated
  using ((select public.is_malta_admin()));

alter table public.locked_feed_dates replica identity full;

alter publication supabase_realtime add table public.locked_feed_dates;
