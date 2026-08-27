-- Malta photos: public gallery files plus metadata. Sitters (no login) get +2 patounes per photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'malta-photos',
  'malta-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
);

create table public.malta_photos (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.sitters (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint malta_photos_path_length check (char_length(storage_path) between 1 and 500),
  constraint malta_photos_path_unique unique (storage_path)
);

create index malta_photos_sitter_id_idx on public.malta_photos (sitter_id);
create index malta_photos_created_at_idx on public.malta_photos (created_at desc);

alter table public.malta_photos enable row level security;

create policy "Anyone can read malta photos"
  on public.malta_photos
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert malta photos"
  on public.malta_photos
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on table public.malta_photos to anon, authenticated;

create policy "Anyone can read malta photo objects"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'malta-photos');

create policy "Anyone can upload malta photo objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'malta-photos');
