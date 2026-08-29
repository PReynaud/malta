-- Admin malus patounes: subtract from a sitter's total score.

alter table public.sitters
  add column malus_patounes integer not null default 0;

alter table public.sitters
  add constraint sitters_malus_patounes_nonnegative check (malus_patounes >= 0);

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

    if new.malus_patounes is distinct from 0
       and not (select public.is_malta_admin()) then
      new.malus_patounes := 0;
    end if;

    return new;
  end if;

  if (
    new.bonus_patounes is distinct from old.bonus_patounes
    or new.malus_patounes is distinct from old.malus_patounes
  ) and not (select public.is_malta_admin()) then
    raise exception 'Only admins can change bonus or malus patounes'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
