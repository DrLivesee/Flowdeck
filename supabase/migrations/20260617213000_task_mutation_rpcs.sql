create or replace function public.create_task_with_relations(
  p_board_id uuid,
  p_column_id uuid,
  p_assignee_id uuid,
  p_title text,
  p_description text,
  p_priority public.task_priority,
  p_deadline date,
  p_tag_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_task_id uuid;
  v_sort_order integer;
  v_completed_at timestamptz;
begin
  select coalesce(max(sort_order), 0) + 100
  into v_sort_order
  from public.tasks
  where column_id = p_column_id;

  select case when final then now() else null end
  into v_completed_at
  from public.columns
  where id = p_column_id
    and board_id = p_board_id;

  insert into public.tasks (
    board_id,
    column_id,
    assignee_id,
    created_by,
    title,
    description,
    priority,
    deadline,
    sort_order,
    completed_at
  )
  values (
    p_board_id,
    p_column_id,
    p_assignee_id,
    auth.uid(),
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_priority,
    p_deadline,
    v_sort_order,
    v_completed_at
  )
  returning id into v_task_id;

  if cardinality(p_tag_ids) > 0 then
    insert into public.task_tags (task_id, tag_id)
    select v_task_id, tag_id
    from unnest(p_tag_ids) as tag_id;
  end if;

  insert into public.activity_events (task_id, type, message)
  values (v_task_id, 'task.created', 'Task created');

  return v_task_id;
end;
$$;

create or replace function public.update_task_with_relations(
  p_task_id uuid,
  p_assignee_id uuid,
  p_title text,
  p_description text,
  p_priority public.task_priority,
  p_deadline date,
  p_tag_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_old_priority public.task_priority;
  v_old_deadline date;
  v_activity_type text;
begin
  select priority, deadline
  into v_old_priority, v_old_deadline
  from public.tasks
  where id = p_task_id;

  update public.tasks
  set assignee_id = p_assignee_id,
      title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      priority = p_priority,
      deadline = p_deadline,
      updated_at = now()
  where id = p_task_id;

  delete from public.task_tags
  where task_id = p_task_id;

  if cardinality(p_tag_ids) > 0 then
    insert into public.task_tags (task_id, tag_id)
    select p_task_id, tag_id
    from unnest(p_tag_ids) as tag_id;
  end if;

  v_activity_type := case
    when v_old_priority is distinct from p_priority then 'task.priorityChanged'
    when v_old_deadline is distinct from p_deadline then 'task.deadlineChanged'
    else 'task.updated'
  end;

  insert into public.activity_events (task_id, type, message)
  values (p_task_id, v_activity_type, 'Task updated');
end;
$$;

create or replace function public.move_task_with_sort(
  p_task_id uuid,
  p_target_column_id uuid,
  p_target_index integer default null
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_source_column_id uuid;
  v_target_ids uuid[];
  v_source_ids uuid[];
  v_next_target_ids uuid[];
  v_target_count integer;
  v_safe_index integer;
  v_completed_at timestamptz;
  v_id uuid;
  v_index integer;
begin
  select column_id
  into v_source_column_id
  from public.tasks
  where id = p_task_id;

  select case when final then now() else null end
  into v_completed_at
  from public.columns
  where id = p_target_column_id;

  select coalesce(array_agg(id order by sort_order), '{}'::uuid[])
  into v_target_ids
  from public.tasks
  where column_id = p_target_column_id
    and id <> p_task_id;

  v_target_count := cardinality(v_target_ids);
  v_safe_index := greatest(0, least(coalesce(p_target_index, v_target_count), v_target_count));
  v_next_target_ids := coalesce(v_target_ids[1:v_safe_index], '{}'::uuid[])
    || p_task_id
    || coalesce(v_target_ids[v_safe_index + 1:v_target_count], '{}'::uuid[]);

  update public.tasks
  set column_id = p_target_column_id,
      completed_at = v_completed_at,
      updated_at = now()
  where id = p_task_id;

  for v_id, v_index in
    select id, ordinality::integer
    from unnest(v_next_target_ids) with ordinality as ordered_tasks(id, ordinality)
  loop
    update public.tasks
    set sort_order = v_index * 100
    where id = v_id;
  end loop;

  if v_source_column_id is distinct from p_target_column_id then
    select coalesce(array_agg(id order by sort_order), '{}'::uuid[])
    into v_source_ids
    from public.tasks
    where column_id = v_source_column_id
      and id <> p_task_id;

    for v_id, v_index in
      select id, ordinality::integer
      from unnest(v_source_ids) with ordinality as ordered_tasks(id, ordinality)
    loop
      update public.tasks
      set sort_order = v_index * 100
      where id = v_id;
    end loop;
  end if;

  insert into public.activity_events (task_id, type, message)
  values (p_task_id, 'task.moved', 'Task moved');
end;
$$;

create or replace function public.reorder_task_in_column(
  p_task_id uuid,
  p_column_id uuid,
  p_target_index integer
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_ids uuid[];
  v_next_ids uuid[];
  v_count integer;
  v_safe_index integer;
  v_id uuid;
  v_index integer;
begin
  select coalesce(array_agg(id order by sort_order), '{}'::uuid[])
  into v_ids
  from public.tasks
  where column_id = p_column_id
    and id <> p_task_id;

  v_count := cardinality(v_ids);
  v_safe_index := greatest(0, least(p_target_index, v_count));
  v_next_ids := coalesce(v_ids[1:v_safe_index], '{}'::uuid[])
    || p_task_id
    || coalesce(v_ids[v_safe_index + 1:v_count], '{}'::uuid[]);

  for v_id, v_index in
    select id, ordinality::integer
    from unnest(v_next_ids) with ordinality as ordered_tasks(id, ordinality)
  loop
    update public.tasks
    set sort_order = v_index * 100,
        updated_at = case when id = p_task_id then now() else updated_at end
    where id = v_id;
  end loop;
end;
$$;
