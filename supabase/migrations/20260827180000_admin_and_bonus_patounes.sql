-- Admin back office: bonus patounes and admin-only deletes.
-- Do not store an auth password here. If pierre.reynaud@outlook.com already
-- exists in Auth, mark it as admin. Create that user in the Supabase dashboard
-- (or local Studio) with a password that is not committed.

alter table public.sitters
  add column bonus_patounes integer not null default 0;

alter table public.sitters
  add constraint sitters_bonus_patounes_nonnegative check (bonus_patounes >= 0);

create or replace function public.is_malta_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'pierre.reynaud@outlook.com',
    false
  );
$$;

revoke all on function public.is_malta_admin() from public;
grant execute on function public.is_malta_admin() to anon, authenticated;

create or replace function public.protect_sitter_bonus_patounes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.bonus_patounes is distinct from 0
       and not (select public.is_malta_admin()) then
      new.bonus_patounes := 0;
    end if;
    return new;
  end if;

  if new.bonus_patounes is distinct from old.bonus_patounes
     and not (select public.is_malta_admin()) then
    raise exception 'Only admins can change bonus patounes'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger sitters_protect_bonus_patounes
before insert or update on public.sitters
for each row
execute function public.protect_sitter_bonus_patounes();

grant delete on table public.sitters to authenticated;
grant delete on table public.malta_photos to authenticated;

create policy "Admins can delete sitters"
  on public.sitters
  for delete
  to authenticated
  using ((select public.is_malta_admin()));

create policy "Admins can delete malta photos"
  on public.malta_photos
  for delete
  to authenticated
  using ((select public.is_malta_admin()));

create policy "Admins can delete malta photo objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'malta-photos'
    and (select public.is_malta_admin())
  );

update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
  updated_at = now()
where lower(email) = 'pierre.reynaud@outlook.com';
