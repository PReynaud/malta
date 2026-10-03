-- Photo contest votes. Patounes stay a manual admin edit; votes never write bonus or malus.

create table public.photo_contest (
  id integer primary key,
  closed boolean not null default false,
  constraint photo_contest_singleton check (id = 1)
);

insert into public.photo_contest (id, closed)
values (1, false);

create table public.photo_contest_votes (
  id uuid primary key default gen_random_uuid(),
  voter_sitter_id uuid not null references public.sitters (id) on delete cascade,
  photo_id uuid not null references public.malta_photos (id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  constraint photo_contest_votes_category_check
    check (category in ('cutest', 'funniest', 'lamest')),
  constraint photo_contest_votes_voter_category_unique
    unique (voter_sitter_id, category)
);

create index photo_contest_votes_photo_id_idx
  on public.photo_contest_votes (photo_id);

alter table public.photo_contest enable row level security;
alter table public.photo_contest_votes enable row level security;

create policy "Anyone can read the photo contest"
  on public.photo_contest
  for select
  to anon, authenticated
  using (true);

create policy "Admins can update the photo contest"
  on public.photo_contest
  for update
  to authenticated
  using ((select public.is_malta_admin()))
  with check ((select public.is_malta_admin()));

create policy "Anyone can read photo contest votes"
  on public.photo_contest_votes
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert photo contest votes while open"
  on public.photo_contest_votes
  for insert
  to anon, authenticated
  with check (
    (select closed from public.photo_contest where id = 1) is not true
  );

create policy "Anyone can update photo contest votes while open"
  on public.photo_contest_votes
  for update
  to anon, authenticated
  using ((select closed from public.photo_contest where id = 1) is not true)
  with check ((select closed from public.photo_contest where id = 1) is not true);

create policy "Anyone can delete photo contest votes while open"
  on public.photo_contest_votes
  for delete
  to anon, authenticated
  using ((select closed from public.photo_contest where id = 1) is not true);

grant select on table public.photo_contest to anon, authenticated;
grant update on table public.photo_contest to authenticated;

grant select, insert, update, delete on table public.photo_contest_votes to anon, authenticated;

alter table public.photo_contest replica identity full;
alter table public.photo_contest_votes replica identity full;

alter publication supabase_realtime add table public.photo_contest, public.photo_contest_votes;

-- The finale no longer accepts new photos from the public page.
drop policy "Anyone can insert malta photos" on public.malta_photos;
drop policy "Anyone can upload malta photo objects" on storage.objects;

revoke insert on table public.malta_photos from anon, authenticated;
