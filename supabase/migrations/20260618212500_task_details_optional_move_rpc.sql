create or replace function public.update_task_with_relations_and_optional_move(
  p_task_id uuid,
  p_assignee_id uuid,
  p_title text,
  p_description text,
  p_priority public.task_priority,
  p_deadline date,
  p_tag_ids uuid[] default '{}'::uuid[],
  p_target_column_id uuid default null
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_current_column_id uuid;
begin
  select column_id
  into v_current_column_id
  from public.tasks
  where id = p_task_id;

  if v_current_column_id is null then
    raise exception 'Task % was not found or is not accessible.', p_task_id;
  end if;

  perform public.update_task_with_relations(
    p_task_id,
    p_assignee_id,
    p_title,
    p_description,
    p_priority,
    p_deadline,
    p_tag_ids
  );

  if p_target_column_id is not null and p_target_column_id is distinct from v_current_column_id then
    perform public.move_task_with_sort(p_task_id, p_target_column_id, null);
  end if;
end;
$$;

grant execute on function public.update_task_with_relations_and_optional_move(uuid, uuid, text, text, public.task_priority, date, uuid[], uuid) to authenticated;
