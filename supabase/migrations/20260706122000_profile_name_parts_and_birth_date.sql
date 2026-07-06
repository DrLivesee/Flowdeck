alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists middle_name text,
  add column if not exists birth_date date;

with parsed_profiles as (
  select
    id,
    regexp_split_to_array(trim(regexp_replace(coalesce(full_name, ''), '\s+', ' ', 'g')), ' ') as name_parts
  from public.profiles
)
update public.profiles
set
  first_name = coalesce(nullif(parsed_profiles.name_parts[1], ''), 'Не указано'),
  last_name = coalesce(nullif(parsed_profiles.name_parts[2], ''), 'Не указано'),
  middle_name = case
    when array_length(parsed_profiles.name_parts, 1) > 2
      then nullif(array_to_string(parsed_profiles.name_parts[3:array_length(parsed_profiles.name_parts, 1)], ' '), '')
    else null
  end,
  updated_at = now()
from parsed_profiles
where profiles.id = parsed_profiles.id
  and (profiles.first_name is null or profiles.last_name is null);

alter table public.profiles
  alter column first_name set not null,
  alter column last_name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_first_name_not_blank'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_first_name_not_blank check (length(trim(first_name)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_last_name_not_blank'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_last_name_not_blank check (length(trim(last_name)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_birth_date_not_future'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_birth_date_not_future check (birth_date is null or birth_date <= current_date);
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
  v_birth_date date;
  v_birth_date_text text;
  v_first_name text;
  v_full_name text;
  v_last_name text;
  v_legacy_full_name text;
  v_middle_name text;
  v_name_parts text[];
begin
  -- Public registration must never create an admin profile.
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('manager', 'worker', 'guest')
      then (new.raw_user_meta_data ->> 'role')::public.app_role
    else 'worker'::public.app_role
  end;

  v_first_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), '');
  v_last_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), '');
  v_middle_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'middle_name', '')), '');
  v_legacy_full_name := nullif(trim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '\s+', ' ', 'g')), '');

  if (v_first_name is null or v_last_name is null) and v_legacy_full_name is not null then
    v_name_parts := regexp_split_to_array(v_legacy_full_name, ' ');
    v_first_name := coalesce(v_first_name, nullif(v_name_parts[1], ''));
    v_last_name := coalesce(v_last_name, nullif(v_name_parts[2], ''));

    if v_middle_name is null and array_length(v_name_parts, 1) > 2 then
      v_middle_name := nullif(array_to_string(v_name_parts[3:array_length(v_name_parts, 1)], ' '), '');
    end if;
  end if;

  v_first_name := coalesce(v_first_name, 'Не указано');
  v_last_name := coalesce(v_last_name, 'Не указано');
  v_birth_date_text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'birth_date', '')), '');

  if v_birth_date_text is not null then
    v_birth_date := v_birth_date_text::date;

    if v_birth_date > current_date then
      raise exception 'Birth date cannot be in the future.' using errcode = '22023';
    end if;
  end if;

  v_full_name := trim(regexp_replace(concat_ws(' ', v_first_name, v_last_name, v_middle_name), '\s+', ' ', 'g'));

  insert into public.profiles (id, email, first_name, last_name, middle_name, full_name, birth_date, role)
  values (
    new.id,
    new.email,
    v_first_name,
    v_last_name,
    v_middle_name,
    v_full_name,
    v_birth_date,
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        middle_name = excluded.middle_name,
        full_name = excluded.full_name,
        birth_date = excluded.birth_date,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

create or replace function public.update_own_profile(
  p_first_name text,
  p_last_name text,
  p_middle_name text default null,
  p_birth_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
  v_full_name text;
  v_last_name text;
  v_middle_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  v_first_name := nullif(trim(coalesce(p_first_name, '')), '');
  v_last_name := nullif(trim(coalesce(p_last_name, '')), '');
  v_middle_name := nullif(trim(coalesce(p_middle_name, '')), '');

  if v_first_name is null then
    raise exception 'First name is required.' using errcode = '22023';
  end if;

  if v_last_name is null then
    raise exception 'Last name is required.' using errcode = '22023';
  end if;

  if p_birth_date is not null and p_birth_date > current_date then
    raise exception 'Birth date cannot be in the future.' using errcode = '22023';
  end if;

  v_full_name := trim(regexp_replace(concat_ws(' ', v_first_name, v_last_name, v_middle_name), '\s+', ' ', 'g'));

  update public.profiles
  set
    first_name = v_first_name,
    last_name = v_last_name,
    middle_name = v_middle_name,
    full_name = v_full_name,
    birth_date = p_birth_date,
    updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'Profile was not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.update_own_profile(text, text, text, date) from public;
grant execute on function public.update_own_profile(text, text, text, date) to authenticated;

comment on function public.handle_new_user() is
  'Creates profiles for public registration. Admin role is intentionally ignored and name parts are stored separately.';

comment on function public.update_own_profile(text, text, text, date) is
  'Allows authenticated users to update their own safe profile fields without changing email or role.';
