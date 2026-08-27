-- Lock feeding-slot edits once the Paris calendar day has started.
-- Broadcast sitters and slots to every open tab.

drop policy if exists "Anyone can insert feeding slots" on public.feeding_slots;
drop policy if exists "Anyone can delete feeding slots" on public.feeding_slots;

create policy "Anyone can insert future feeding slots"
  on public.feeding_slots
  for insert
  to anon, authenticated
  with check (feed_date > (timezone('Europe/Paris', now()))::date);

create policy "Anyone can delete future feeding slots"
  on public.feeding_slots
  for delete
  to anon, authenticated
  using (feed_date > (timezone('Europe/Paris', now()))::date);

alter table public.sitters replica identity full;
alter table public.feeding_slots replica identity full;

alter publication supabase_realtime add table public.sitters, public.feeding_slots;
