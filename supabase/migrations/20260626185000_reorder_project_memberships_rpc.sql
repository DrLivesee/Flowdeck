create or replace function public.reorder_project_memberships(
  p_project_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_project_ids uuid[];
  v_membership_count integer;
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct project_id), '{}'::uuid[])
  into v_project_ids
  from unnest(coalesce(p_project_ids, '{}'::uuid[])) as project_ids(project_id);

  if cardinality(v_project_ids) <> cardinality(coalesce(p_project_ids, '{}'::uuid[])) then
    raise exception 'Project ids must be unique.' using errcode = '22023';
  end if;

  select count(*)
  into v_membership_count
  from public.project_members
  where project_members.profile_id = v_current_user_id;

  if cardinality(v_project_ids) <> v_membership_count then
    raise exception 'Project order must include every project membership.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_project_ids) as project_ids(project_id)
    where not exists (
      select 1
      from public.project_members
      where project_members.profile_id = v_current_user_id
        and project_members.project_id = project_ids.project_id
    )
  ) then
    raise exception 'Project order contains inaccessible projects.' using errcode = '42501';
  end if;

  update public.project_members
  set sort_order = ordered_projects.ordinality::integer * 100
  from unnest(v_project_ids) with ordinality as ordered_projects(project_id, ordinality)
  where project_members.profile_id = v_current_user_id
    and project_members.project_id = ordered_projects.project_id;
end;
$$;

grant execute on function public.reorder_project_memberships(uuid[]) to authenticated;

comment on function public.reorder_project_memberships(uuid[]) is
  'Allows an authenticated non-admin/member user to reorder only their own project_members rows without changing global project order.';
