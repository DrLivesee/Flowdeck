create or replace function public.create_project_with_members(
  p_name text,
  p_description text default null,
  p_member_ids uuid[] default '{}'::uuid[],
  p_default_board_name text default 'Основная доска',
  p_default_column_names text[] default array['Бэклог', 'В работе', 'На проверке', 'Готово']::text[]
)
returns table(project_id uuid, board_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_board_id uuid;
  v_project_sort_order integer;
  v_board_sort_order integer;
  v_member_ids uuid[];
  v_column_names text[];
  v_column_name text;
  v_column_index integer;
  v_column_accents text[] := array['slate', 'cyan', 'violet', 'emerald']::text[];
  v_invalid_member_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only admin can create projects.' using errcode = '42501';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Project name is required.' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct member_id), '{}'::uuid[])
  into v_member_ids
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) as member_ids(member_id);

  if cardinality(v_member_ids) = 0 then
    raise exception 'Project must have at least one member.' using errcode = '22023';
  end if;

  select count(*)
  into v_invalid_member_count
  from unnest(v_member_ids) as member_ids(member_id)
  left join public.profiles on profiles.id = member_ids.member_id and profiles.role <> 'admin'::public.app_role
  where profiles.id is null;

  if v_invalid_member_count > 0 then
    raise exception 'Project members must be existing non-admin profiles.' using errcode = '22023';
  end if;

  v_column_names := coalesce(p_default_column_names, array['Бэклог', 'В работе', 'На проверке', 'Готово']::text[]);

  if cardinality(v_column_names) = 0 then
    v_column_names := array['Бэклог', 'В работе', 'На проверке', 'Готово']::text[];
  end if;

  select coalesce(max(sort_order), 0) + 100
  into v_project_sort_order
  from public.projects;

  insert into public.projects (name, description, sort_order)
  values (
    trim(p_name),
    nullif(trim(coalesce(p_description, '')), ''),
    v_project_sort_order
  )
  returning id into v_project_id;

  select coalesce(max(sort_order), 0) + 100
  into v_board_sort_order
  from public.boards
  where boards.project_id = v_project_id;

  insert into public.boards (project_id, name, sort_order)
  values (
    v_project_id,
    nullif(trim(coalesce(p_default_board_name, '')), ''),
    v_board_sort_order
  )
  returning id into v_board_id;

  for v_column_name, v_column_index in
    select column_names.column_name, column_names.ordinality::integer
    from unnest(v_column_names) with ordinality as column_names(column_name, ordinality)
  loop
    insert into public.columns (board_id, name, accent, final, sort_order)
    values (
      v_board_id,
      trim(v_column_name),
      v_column_accents[least(v_column_index, cardinality(v_column_accents))],
      v_column_index = cardinality(v_column_names),
      v_column_index * 100
    );
  end loop;

  insert into public.project_members (project_id, profile_id, sort_order)
  select
    v_project_id,
    member_ids.member_id,
    coalesce((
      select max(existing_members.sort_order) + 100
      from public.project_members as existing_members
      where existing_members.profile_id = member_ids.member_id
    ), 100)
  from unnest(v_member_ids) as member_ids(member_id);

  return query select v_project_id, v_board_id;
end;
$$;

create or replace function public.update_project_members(
  p_project_id uuid,
  p_member_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_ids uuid[];
  v_invalid_member_count integer;
  v_project_exists boolean;
begin
  if not public.is_admin() then
    raise exception 'Only admin can update project members.' using errcode = '42501';
  end if;

  select exists(select 1 from public.projects where projects.id = p_project_id)
  into v_project_exists;

  if not v_project_exists then
    raise exception 'Project % was not found.', p_project_id using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct member_id), '{}'::uuid[])
  into v_member_ids
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) as member_ids(member_id);

  select count(*)
  into v_invalid_member_count
  from unnest(v_member_ids) as member_ids(member_id)
  left join public.profiles on profiles.id = member_ids.member_id and profiles.role <> 'admin'::public.app_role
  where profiles.id is null;

  if v_invalid_member_count > 0 then
    raise exception 'Project members must be existing non-admin profiles.' using errcode = '22023';
  end if;

  delete from public.project_members
  where project_members.project_id = p_project_id
    and (
      cardinality(v_member_ids) = 0
      or not project_members.profile_id = any(v_member_ids)
    );

  if cardinality(v_member_ids) > 0 then
    insert into public.project_members (project_id, profile_id, sort_order)
    select
      p_project_id,
      member_ids.member_id,
      coalesce((
        select max(existing_members.sort_order) + 100
        from public.project_members as existing_members
        where existing_members.profile_id = member_ids.member_id
      ), 100)
    from unnest(v_member_ids) as member_ids(member_id)
    on conflict (project_id, profile_id) do nothing;
  end if;
end;
$$;

grant execute on function public.create_project_with_members(text, text, uuid[], text, text[]) to authenticated;
grant execute on function public.update_project_members(uuid, uuid[]) to authenticated;

comment on function public.create_project_with_members(text, text, uuid[], text, text[]) is
  'Admin-only RPC that atomically creates a project, its default board/columns, and assigned project memberships.';

comment on function public.update_project_members(uuid, uuid[]) is
  'Admin-only RPC that synchronizes assigned non-admin project members while preserving existing member sort_order.';
