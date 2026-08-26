-- Sitters can edit their name and color after joining (no login).

grant update on table public.sitters to anon, authenticated;

create policy "Anyone can update sitters"
  on public.sitters
  for update
  to anon, authenticated
  using (true)
  with check (true);
