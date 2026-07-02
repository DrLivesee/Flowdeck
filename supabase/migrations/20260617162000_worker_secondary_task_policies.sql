drop policy if exists checklist_items_worker_insert_assigned on public.checklist_items;
drop policy if exists checklist_items_worker_update_assigned on public.checklist_items;
drop policy if exists checklist_items_worker_delete_assigned on public.checklist_items;
drop policy if exists task_comments_worker_insert_assigned on public.task_comments;
drop policy if exists task_comments_worker_update_assigned on public.task_comments;
drop policy if exists task_comments_worker_delete_assigned on public.task_comments;
drop policy if exists activity_events_worker_insert_assigned on public.activity_events;

create policy checklist_items_worker_insert_assigned
on public.checklist_items
for insert
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = checklist_items.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy checklist_items_worker_update_assigned
on public.checklist_items
for update
using (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = checklist_items.task_id
      and tasks.assignee_id = auth.uid()
  )
)
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = checklist_items.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy checklist_items_worker_delete_assigned
on public.checklist_items
for delete
using (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = checklist_items.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy task_comments_worker_insert_assigned
on public.task_comments
for insert
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy task_comments_worker_update_assigned
on public.task_comments
for update
using (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.assignee_id = auth.uid()
  )
)
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy task_comments_worker_delete_assigned
on public.task_comments
for delete
using (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.assignee_id = auth.uid()
  )
);

create policy activity_events_worker_insert_assigned
on public.activity_events
for insert
with check (
  is_worker()
  and exists (
    select 1
    from public.tasks
    where tasks.id = activity_events.task_id
      and tasks.assignee_id = auth.uid()
  )
);
