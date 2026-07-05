create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select profiles.role
  from public.profiles
  where profiles.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin'::public.app_role, false)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'manager'::public.app_role, false)
$$;

create or replace function public.is_worker()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'worker'::public.app_role, false)
$$;

create or replace function public.is_guest()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'guest'::public.app_role, false)
$$;

create or replace function public.is_profile_project_member(p_profile_id uuid, p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_members.project_id = p_project_id
      and project_members.profile_id = p_profile_id
  )
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_project_member(auth.uid(), p_project_id)
$$;

create or replace function public.can_read_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_project_member(p_project_id)
$$;

create or replace function public.can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
$$;

create or replace function public.can_manage_project_content(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manager() and public.is_project_member(p_project_id)
$$;

create or replace function public.get_board_project_id(p_board_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select boards.project_id
  from public.boards
  where boards.id = p_board_id
$$;

create or replace function public.get_task_project_id(p_task_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select boards.project_id
  from public.tasks
  join public.boards on boards.id = tasks.board_id
  where tasks.id = p_task_id
$$;

create or replace function public.can_read_board(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_project(public.get_board_project_id(p_board_id))
$$;

create or replace function public.can_manage_board_content(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_project_content(public.get_board_project_id(p_board_id))
$$;

create or replace function public.can_read_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_project(public.get_task_project_id(p_task_id))
$$;

create or replace function public.can_manage_task_content(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_project_content(public.get_task_project_id(p_task_id))
$$;

create or replace function public.can_worker_manage_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks
    where tasks.id = p_task_id
      and tasks.assignee_id = auth.uid()
      and public.is_worker()
      and public.can_read_board(tasks.board_id)
  )
$$;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'projects',
        'project_members',
        'boards',
        'columns',
        'tasks',
        'tags',
        'task_tags',
        'checklist_items',
        'task_comments',
        'activity_events'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end;
$$;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.checklist_items enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_events enable row level security;

create policy projects_select_accessible
on public.projects
for select
to authenticated
using (public.can_read_project(id));

create policy projects_insert_admin
on public.projects
for insert
to authenticated
with check (public.is_admin());

create policy projects_update_admin
on public.projects
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy projects_delete_admin
on public.projects
for delete
to authenticated
using (public.is_admin());

create policy project_members_select_project_team
on public.project_members
for select
to authenticated
using (public.is_admin() or profile_id = auth.uid() or public.is_project_member(project_id));

create policy project_members_insert_admin
on public.project_members
for insert
to authenticated
with check (public.is_admin());

create policy project_members_update_admin
on public.project_members
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy project_members_delete_admin
on public.project_members
for delete
to authenticated
using (public.is_admin());

create policy boards_select_accessible
on public.boards
for select
to authenticated
using (public.can_read_project(project_id));

create policy boards_insert_project_manager
on public.boards
for insert
to authenticated
with check (public.can_manage_project_content(project_id));

create policy boards_update_project_manager
on public.boards
for update
to authenticated
using (public.can_manage_project_content(project_id))
with check (public.can_manage_project_content(project_id));

create policy boards_delete_project_manager
on public.boards
for delete
to authenticated
using (public.can_manage_project_content(project_id));

create policy columns_select_accessible
on public.columns
for select
to authenticated
using (public.can_read_board(board_id));

create policy columns_insert_project_manager
on public.columns
for insert
to authenticated
with check (public.can_manage_board_content(board_id));

create policy columns_update_project_manager
on public.columns
for update
to authenticated
using (public.can_manage_board_content(board_id))
with check (public.can_manage_board_content(board_id));

create policy columns_delete_project_manager
on public.columns
for delete
to authenticated
using (public.can_manage_board_content(board_id));

create policy tasks_select_accessible
on public.tasks
for select
to authenticated
using (public.can_read_board(board_id));

create policy tasks_insert_project_manager_or_worker_self
on public.tasks
for insert
to authenticated
with check (
  (
    public.can_manage_board_content(board_id)
    and (assignee_id is null or public.is_profile_project_member(assignee_id, public.get_board_project_id(board_id)))
  )
  or (
    public.is_worker()
    and public.can_read_board(board_id)
    and assignee_id = auth.uid()
  )
);

create policy tasks_update_project_manager_or_worker_self
on public.tasks
for update
to authenticated
using (
  public.can_manage_board_content(board_id)
  or public.can_worker_manage_task(id)
)
with check (
  (
    public.can_manage_board_content(board_id)
    and (assignee_id is null or public.is_profile_project_member(assignee_id, public.get_board_project_id(board_id)))
  )
  or (
    public.is_worker()
    and public.can_read_board(board_id)
    and assignee_id = auth.uid()
  )
);

create policy tasks_delete_project_manager
on public.tasks
for delete
to authenticated
using (public.can_manage_board_content(board_id));

create policy tags_select_authenticated
on public.tags
for select
to authenticated
using (true);

create policy tags_insert_manager
on public.tags
for insert
to authenticated
with check (public.is_manager());

create policy tags_update_manager
on public.tags
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy tags_delete_manager
on public.tags
for delete
to authenticated
using (public.is_manager());

create policy task_tags_select_accessible
on public.task_tags
for select
to authenticated
using (public.can_read_task(task_id));

create policy task_tags_insert_manager_or_worker_assigned
on public.task_tags
for insert
to authenticated
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy task_tags_delete_manager_or_worker_assigned
on public.task_tags
for delete
to authenticated
using (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy checklist_items_select_accessible
on public.checklist_items
for select
to authenticated
using (public.can_read_task(task_id));

create policy checklist_items_insert_manager_or_worker_assigned
on public.checklist_items
for insert
to authenticated
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy checklist_items_update_manager_or_worker_assigned
on public.checklist_items
for update
to authenticated
using (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id))
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy checklist_items_delete_manager_or_worker_assigned
on public.checklist_items
for delete
to authenticated
using (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy task_comments_select_accessible
on public.task_comments
for select
to authenticated
using (public.can_read_task(task_id));

create policy task_comments_insert_manager_or_worker_assigned
on public.task_comments
for insert
to authenticated
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy task_comments_update_manager_or_worker_assigned
on public.task_comments
for update
to authenticated
using (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id))
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy task_comments_delete_manager_or_worker_assigned
on public.task_comments
for delete
to authenticated
using (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

create policy activity_events_select_accessible
on public.activity_events
for select
to authenticated
using (public.can_read_task(task_id));

create policy activity_events_insert_manager_or_worker_assigned
on public.activity_events
for insert
to authenticated
with check (public.can_manage_task_content(task_id) or public.can_worker_manage_task(task_id));

comment on function public.can_manage_project(uuid) is
  'Project CRUD is admin-only in Flowdeck. Managers manage content, not projects.';

comment on function public.can_manage_project_content(uuid) is
  'Project content management is limited to managers who are members of the project. Admin is intentionally excluded.';
