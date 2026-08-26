-- Sitters pick a name and color (no login). Feeding slots cover September 2026.

create table public.sitters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  constraint sitters_name_trimmed check (name = trim(name)),
  constraint sitters_name_length check (char_length(name) between 1 and 40),
  constraint sitters_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index sitters_name_lower_idx on public.sitters (lower(name));

create table public.feeding_slots (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.sitters (id) on delete cascade,
  feed_date date not null,
  created_at timestamptz not null default now(),
  constraint feeding_slots_unique unique (sitter_id, feed_date),
  constraint feeding_slots_september_2026 check (
    feed_date >= date '2026-09-01' and feed_date <= date '2026-09-30'
  )
);

create index feeding_slots_sitter_id_idx on public.feeding_slots (sitter_id);
create index feeding_slots_feed_date_idx on public.feeding_slots (feed_date);

alter table public.sitters enable row level security;
alter table public.feeding_slots enable row level security;

create policy "Anyone can read sitters"
  on public.sitters
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert sitters"
  on public.sitters
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read feeding slots"
  on public.feeding_slots
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert feeding slots"
  on public.feeding_slots
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can delete feeding slots"
  on public.feeding_slots
  for delete
  to anon, authenticated
  using (true);

grant select, insert on table public.sitters to anon, authenticated;
grant select, insert, delete on table public.feeding_slots to anon, authenticated;
