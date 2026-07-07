create or replace function public.enforce_projects_total_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 20;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('flowdeck:projects_total_limit'));

  select count(*)
  into v_count
  from public.projects;

  if v_count >= v_limit then
    raise exception 'Project limit reached. Flowdeck allows up to % projects.', v_limit using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_boards_per_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 10;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('flowdeck:boards_per_project_limit'), hashtext(new.project_id::text));

  select count(*)
  into v_count
  from public.boards
  where boards.project_id = new.project_id;

  if v_count >= v_limit then
    raise exception 'Board limit reached. Flowdeck allows up to % boards per project.', v_limit using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_columns_per_board_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 12;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('flowdeck:columns_per_board_limit'), hashtext(new.board_id::text));

  select count(*)
  into v_count
  from public.columns
  where columns.board_id = new.board_id;

  if v_count >= v_limit then
    raise exception 'Column limit reached. Flowdeck allows up to % columns per board.', v_limit using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_tasks_per_board_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 300;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('flowdeck:tasks_per_board_limit'), hashtext(new.board_id::text));

  select count(*)
  into v_count
  from public.tasks
  where tasks.board_id = new.board_id;

  if v_count >= v_limit then
    raise exception 'Task limit reached. Flowdeck allows up to % tasks per board.', v_limit using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_tags_total_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 50;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('flowdeck:tags_total_limit'));

  select count(*)
  into v_count
  from public.tags;

  if v_count >= v_limit then
    raise exception 'Tag limit reached. Flowdeck allows up to % tags.', v_limit using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_total_limit_before_insert on public.projects;
create trigger projects_total_limit_before_insert
before insert on public.projects
for each row
execute function public.enforce_projects_total_limit();

drop trigger if exists boards_per_project_limit_before_insert on public.boards;
create trigger boards_per_project_limit_before_insert
before insert on public.boards
for each row
execute function public.enforce_boards_per_project_limit();

drop trigger if exists columns_per_board_limit_before_insert on public.columns;
create trigger columns_per_board_limit_before_insert
before insert on public.columns
for each row
execute function public.enforce_columns_per_board_limit();

drop trigger if exists tasks_per_board_limit_before_insert on public.tasks;
create trigger tasks_per_board_limit_before_insert
before insert on public.tasks
for each row
execute function public.enforce_tasks_per_board_limit();

drop trigger if exists tags_total_limit_before_insert on public.tags;
create trigger tags_total_limit_before_insert
before insert on public.tags
for each row
execute function public.enforce_tags_total_limit();

comment on function public.enforce_projects_total_limit() is
  'Blocks project inserts after the Flowdeck free-tier project limit is reached.';

comment on function public.enforce_boards_per_project_limit() is
  'Blocks board inserts after the per-project Flowdeck board limit is reached.';

comment on function public.enforce_columns_per_board_limit() is
  'Blocks column inserts after the per-board Flowdeck column limit is reached.';

comment on function public.enforce_tasks_per_board_limit() is
  'Blocks task inserts after the per-board Flowdeck task limit is reached. Archived tasks count toward this limit.';

comment on function public.enforce_tags_total_limit() is
  'Blocks tag inserts after the Flowdeck free-tier tag limit is reached.';
