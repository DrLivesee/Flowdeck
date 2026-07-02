create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 100 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create index if not exists project_members_profile_sort_idx
  on public.project_members (profile_id, sort_order);

create index if not exists project_members_project_idx
  on public.project_members (project_id);

create index if not exists project_members_profile_project_idx
  on public.project_members (profile_id, project_id);

alter table public.project_members enable row level security;

comment on table public.project_members is
  'Maps Flowdeck projects to assigned users. Non-admin users only see projects where they have a membership row.';

comment on column public.project_members.sort_order is
  'Per-user project order used by the sidebar drag-and-drop.';
