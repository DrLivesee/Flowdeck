import type { Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { Project } from "@/entities/project";
import type { Tag, TagColor } from "@/entities/tag";
import type { ActivityEvent, ActivityEventType, Task, TaskComment, TaskPriority } from "@/entities/task";
import { supabase } from "@/shared/api";

import type { ProjectStoreState } from "../model/project-store.types";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type BoardRow = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ColumnRow = {
  id: string;
  board_id: string;
  name: string;
  accent: string;
  final: boolean;
  sort_order: number;
};

type TaskRow = {
  id: string;
  board_id: string;
  column_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  deadline: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  name: string;
  color: TagColor;
};

type TaskTagRow = {
  task_id: string;
  tag_id: string;
};

type ProjectMemberRow = {
  project_id: string;
  profile_id: string;
  sort_order: number;
};

type ChecklistItemRow = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
};

type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  message: string;
  created_at: string;
  updated_at: string | null;
};

type ActivityEventRow = {
  id: string;
  task_id: string;
  type: string;
  message: string;
  created_at: string;
};

type NestedTaskRow = TaskRow & {
  activity_events: ActivityEventRow[] | null;
  checklist_items: ChecklistItemRow[] | null;
  task_comments: TaskCommentRow[] | null;
  task_tags: TaskTagRow[] | null;
};

type NestedColumnRow = ColumnRow & {
  tasks: NestedTaskRow[] | null;
};

type NestedBoardRow = {
  id: string;
  columns: NestedColumnRow[] | null;
};

export type DomainDataSnapshot = ProjectStoreState;

export type WorkspaceSnapshot = Pick<
  ProjectStoreState,
  "activeBoardId" | "activeProjectId" | "boardsById" | "projectIds" | "projectsById"
> & {
  projectTaskStatsById: Record<string, { completedCount: number; taskCount: number }>;
};

export type BoardDataSnapshot = Pick<
  ProjectStoreState,
  "activityById" | "columnsById" | "commentsById" | "tasksById"
>;

export const emptyDomainDataSnapshot: DomainDataSnapshot = {
  activeBoardId: null,
  activeProjectId: null,
  activityById: {},
  boardsById: {},
  columnsById: {},
  commentsById: {},
  projectIds: [],
  projectsById: {},
  tagsById: {},
  tasksById: {},
};

export const emptyWorkspaceSnapshot: WorkspaceSnapshot = {
  activeBoardId: null,
  activeProjectId: null,
  boardsById: {},
  projectIds: [],
  projectsById: {},
  projectTaskStatsById: {},
};

export const emptyBoardDataSnapshot: BoardDataSnapshot = {
  activityById: {},
  columnsById: {},
  commentsById: {},
  tasksById: {},
};

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const [currentUserResult, projects, boards, taskStats, projectMembers] = await Promise.all([
    supabase.auth.getUser(),
    selectRows<ProjectRow>("projects", "id,name,description,sort_order,archived_at,created_at,updated_at"),
    selectRows<BoardRow>("boards", "id,project_id,name,sort_order,created_at,updated_at"),
    selectRows<Pick<TaskRow, "board_id" | "completed_at">>("tasks", "board_id,completed_at"),
    selectRows<ProjectMemberRow>("project_members", "project_id,profile_id,sort_order"),
  ]);
  const currentUserId = currentUserResult.data.user?.id;
  const membershipSortByProjectId = new Map(
    projectMembers
      .filter((member) => member.profile_id === currentUserId)
      .map((member) => [member.project_id, member.sort_order]),
  );
  const sortedProjects = [...projects].sort((left, right) => byProjectOrder(left, right, membershipSortByProjectId));
  const sortedBoards = [...boards].sort(bySortOrder);
  const boardsByProjectId = groupBy(sortedBoards, "project_id");
  const taskStatsByBoardId = groupBy(taskStats, "board_id");
  const projectIds = sortedProjects.map((project) => project.id);
  const projectsById = Object.fromEntries(sortedProjects.map((project) => [project.id, mapProject(project, boardsByProjectId[project.id] ?? [])]));
  const boardsById = Object.fromEntries(sortedBoards.map((board) => [board.id, mapBoard(board, [])]));
  const projectTaskStatsById = Object.fromEntries(
    sortedProjects.map((project) => {
      const projectTasks = (boardsByProjectId[project.id] ?? []).flatMap((board) => taskStatsByBoardId[board.id] ?? []);

      return [
        project.id,
        {
          completedCount: projectTasks.filter((task) => Boolean(task.completed_at)).length,
          taskCount: projectTasks.length,
        },
      ];
    }),
  );
  const activeProjectId = projectIds[0] ?? null;
  const activeBoardId = activeProjectId ? projectsById[activeProjectId]?.boardIds[0] ?? null : null;

  return { activeBoardId, activeProjectId, boardsById, projectIds, projectsById, projectTaskStatsById };
}

export async function getBoardDataSnapshot(boardId: string | null | undefined): Promise<BoardDataSnapshot> {
  if (!boardId) {
    return emptyBoardDataSnapshot;
  }

  const { data, error } = await supabase
    .from("boards")
    .select(`
      id,
      columns (
        id, board_id, name, accent, final, sort_order,
        tasks (
          id, board_id, column_id, assignee_id, title, description, priority, deadline, sort_order, completed_at, created_at, updated_at,
          task_tags ( task_id, tag_id ),
          checklist_items ( id, task_id, title, completed, sort_order, created_at ),
          task_comments ( id, task_id, author_id, message, created_at, updated_at ),
          activity_events ( id, task_id, type, message, created_at )
        )
      )
    `)
    .eq("id", boardId)
    .maybeSingle<NestedBoardRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return emptyBoardDataSnapshot;
  }

  const sortedColumns = [...(data.columns ?? [])].sort(bySortOrder);
  const sortedTasks = sortedColumns.flatMap((column) => column.tasks ?? []).sort(bySortOrder);
  const taskTags = sortedTasks.flatMap((task) => task.task_tags ?? []);
  const checklistItems = sortedTasks.flatMap((task) => task.checklist_items ?? []);
  const comments = sortedTasks.flatMap((task) => task.task_comments ?? []);
  const activity = sortedTasks.flatMap((task) => task.activity_events ?? []);
  const checklistByTaskId = groupBy(checklistItems.sort(bySortOrder), "task_id");
  const commentsByTaskId = groupBy(comments, "task_id");
  const activityByTaskId = groupBy(activity, "task_id");
  const tagIdsByTaskId = groupBy(taskTags, "task_id");
  const tasksByColumnId = groupBy(sortedTasks, "column_id");

  return {
    activityById: Object.fromEntries(activity.map((event) => [event.id, mapActivity(event)])),
    columnsById: Object.fromEntries(sortedColumns.map((column) => [column.id, mapColumn(column, tasksByColumnId[column.id] ?? [])])),
    commentsById: Object.fromEntries(comments.map((comment) => [comment.id, mapComment(comment)])),
    tasksById: Object.fromEntries(
      sortedTasks.map((task) => [
        task.id,
        mapTask(task, {
          activity: activityByTaskId[task.id] ?? [],
          checklist: checklistByTaskId[task.id] ?? [],
          comments: commentsByTaskId[task.id] ?? [],
          tagLinks: tagIdsByTaskId[task.id] ?? [],
        }),
      ]),
    ),
  };
}

export async function getTagsSnapshot() {
  const tags = await selectRows<TagRow>("tags", "id,name,color");

  return Object.fromEntries(tags.map((tag) => [tag.id, mapTag(tag)]));
}

export async function getDomainDataSnapshot(): Promise<DomainDataSnapshot> {
  const [projects, boards, columns, tasks, tags, taskTags, checklistItems, comments, activity] =
    await Promise.all([
      selectRows<ProjectRow>("projects", "id,name,description,sort_order,archived_at,created_at,updated_at"),
      selectRows<BoardRow>("boards", "id,project_id,name,sort_order,created_at,updated_at"),
      selectRows<ColumnRow>("columns", "id,board_id,name,accent,final,sort_order"),
      selectRows<TaskRow>("tasks", "id,board_id,column_id,assignee_id,title,description,priority,deadline,sort_order,completed_at,created_at,updated_at"),
      selectRows<TagRow>("tags", "id,name,color"),
      selectRows<TaskTagRow>("task_tags", "task_id,tag_id"),
      selectRows<ChecklistItemRow>("checklist_items", "id,task_id,title,completed,sort_order,created_at"),
      selectRows<TaskCommentRow>("task_comments", "id,task_id,author_id,message,created_at,updated_at"),
      selectRows<ActivityEventRow>("activity_events", "id,task_id,type,message,created_at"),
    ]);

  return normalizeDomainData({ projects, boards, columns, tasks, tags, taskTags, checklistItems, comments, activity });
}

async function selectRows<TRow>(table: string, columns: string) {
  const { data, error } = await supabase.from(table).select(columns).returns<TRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

function normalizeDomainData(input: {
  activity: ActivityEventRow[];
  boards: BoardRow[];
  checklistItems: ChecklistItemRow[];
  columns: ColumnRow[];
  comments: TaskCommentRow[];
  projects: ProjectRow[];
  tags: TagRow[];
  taskTags: TaskTagRow[];
  tasks: TaskRow[];
}): DomainDataSnapshot {
  const sortedProjects = [...input.projects].sort(bySortOrder);
  const sortedBoards = [...input.boards].sort(bySortOrder);
  const sortedColumns = [...input.columns].sort(bySortOrder);
  const sortedTasks = [...input.tasks].sort(bySortOrder);
  const checklistByTaskId = groupBy(input.checklistItems.sort(bySortOrder), "task_id");
  const commentsByTaskId = groupBy(input.comments, "task_id");
  const activityByTaskId = groupBy(input.activity, "task_id");
  const tagIdsByTaskId = groupBy(input.taskTags, "task_id");
  const boardsByProjectId = groupBy(sortedBoards, "project_id");
  const columnsByBoardId = groupBy(sortedColumns, "board_id");
  const tasksByColumnId = groupBy(sortedTasks, "column_id");
  const projectIds = sortedProjects.map((project) => project.id);
  const projectsById = Object.fromEntries(sortedProjects.map((project) => [project.id, mapProject(project, boardsByProjectId[project.id] ?? [])]));
  const boardsById = Object.fromEntries(sortedBoards.map((board) => [board.id, mapBoard(board, columnsByBoardId[board.id] ?? [])]));
  const columnsById = Object.fromEntries(sortedColumns.map((column) => [column.id, mapColumn(column, tasksByColumnId[column.id] ?? [])]));
  const tagsById = Object.fromEntries(input.tags.map((tag) => [tag.id, mapTag(tag)]));
  const commentsById = Object.fromEntries(input.comments.map((comment) => [comment.id, mapComment(comment)]));
  const activityById = Object.fromEntries(input.activity.map((event) => [event.id, mapActivity(event)]));
  const tasksById = Object.fromEntries(
    sortedTasks.map((task) => [
      task.id,
      mapTask(task, {
        activity: activityByTaskId[task.id] ?? [],
        checklist: checklistByTaskId[task.id] ?? [],
        comments: commentsByTaskId[task.id] ?? [],
        tagLinks: tagIdsByTaskId[task.id] ?? [],
      }),
    ]),
  );
  const activeProjectId = projectIds[0] ?? null;
  const activeBoardId = activeProjectId ? projectsById[activeProjectId]?.boardIds[0] ?? null : null;

  return { activeBoardId, activeProjectId, activityById, boardsById, columnsById, commentsById, projectIds, projectsById, tagsById, tasksById };
}

function mapProject(project: ProjectRow, boards: BoardRow[]): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    boardIds: boards.map((board) => board.id),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    archivedAt: project.archived_at ?? undefined,
  };
}

function mapBoard(board: BoardRow, columns: ColumnRow[]): Board {
  return { id: board.id, projectId: board.project_id, name: board.name, columnIds: columns.map((column) => column.id), createdAt: board.created_at, updatedAt: board.updated_at };
}

function mapColumn(column: ColumnRow, tasks: TaskRow[]): Column {
  return { id: column.id, boardId: column.board_id, name: column.name, accent: getColumnAccent(column.accent), final: column.final, taskIds: tasks.map((task) => task.id) };
}

function mapTask(task: TaskRow, relations: { activity: ActivityEventRow[]; checklist: ChecklistItemRow[]; comments: TaskCommentRow[]; tagLinks: TaskTagRow[] }): Task {
  return {
    id: task.id,
    boardId: task.board_id,
    columnId: task.column_id,
    assigneeId: task.assignee_id ?? undefined,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    tagIds: relations.tagLinks.map((tag) => tag.tag_id),
    checklist: relations.checklist.map((item) => ({ id: item.id, title: item.title, completed: item.completed, createdAt: item.created_at })),
    commentIds: relations.comments.map((comment) => comment.id),
    activityIds: relations.activity.map((event) => event.id),
    deadline: task.deadline ?? undefined,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    completedAt: task.completed_at ?? undefined,
  };
}

function mapTag(tag: TagRow): Tag {
  return { id: tag.id, name: tag.name, color: tag.color };
}

function mapComment(comment: TaskCommentRow): TaskComment {
  return { id: comment.id, taskId: comment.task_id, author: comment.author_id, message: comment.message, createdAt: comment.created_at, updatedAt: comment.updated_at ?? undefined };
}

function mapActivity(event: ActivityEventRow): ActivityEvent {
  return { id: event.id, taskId: event.task_id, type: event.type as ActivityEventType, message: event.message, createdAt: event.created_at };
}

function bySortOrder(left: { sort_order: number }, right: { sort_order: number }) {
  return left.sort_order - right.sort_order;
}

function byProjectOrder(left: ProjectRow, right: ProjectRow, membershipSortByProjectId: Map<string, number>) {
  return (membershipSortByProjectId.get(left.id) ?? left.sort_order) - (membershipSortByProjectId.get(right.id) ?? right.sort_order);
}

function groupBy<TRow extends Record<TKey, string>, TKey extends keyof TRow>(rows: TRow[], key: TKey) {
  return rows.reduce<Record<string, TRow[]>>((result, row) => {
    const groupKey = row[key];
    (result[groupKey] ??= []).push(row);
    return result;
  }, {});
}

function getColumnAccent(value: string): Column["accent"] {
  return ["amber", "blue", "cyan", "emerald", "fuchsia", "rose", "slate", "violet"].includes(value) ? (value as Column["accent"]) : "slate";
}
