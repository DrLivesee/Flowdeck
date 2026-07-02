drop policy if exists task_tags_worker_insert_assigned on public.task_tags;
drop policy if exists task_tags_worker_delete_assigned on public.task_tags;

create policy task_tags_worker_insert_assigned
on public.task_tags
for insert
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_tags.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy task_tags_worker_delete_assigned
on public.task_tags
for delete
using (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_tags.task_id
      and tasks.assignee_id = auth.uid()
  )
);
