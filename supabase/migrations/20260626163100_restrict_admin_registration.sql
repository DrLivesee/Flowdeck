create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  -- Public registration must never create an admin profile.
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('manager', 'worker', 'guest')
      then (new.raw_user_meta_data ->> 'role')::public.app_role
    else 'worker'::public.app_role
  end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

create unique index if not exists profiles_single_admin_idx
  on public.profiles (role)
  where role = 'admin'::public.app_role;

comment on index public.profiles_single_admin_idx is
  'Guarantees that Flowdeck can have at most one admin profile.';

comment on function public.handle_new_user() is
  'Creates profiles for public registration. Admin role is intentionally ignored and must be assigned manually by trusted SQL.';

-- Admin bootstrap after the target user has registered:
-- update public.profiles
-- set role = 'admin'::public.app_role,
--     updated_at = now()
-- where email = 'admin@example.com';
