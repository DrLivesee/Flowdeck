-- Current demo/domain data is intentionally reset before project memberships
-- become the source of project visibility. Auth users and profiles are kept.
delete from public.activity_events;
delete from public.task_comments;
delete from public.checklist_items;
delete from public.task_tags;
delete from public.tasks;
delete from public.columns;
delete from public.boards;
delete from public.project_members;
delete from public.projects;
delete from public.tags;
