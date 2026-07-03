import { buildBoardTaskColumns, type Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { Project } from "@/entities/project";
import type { Task, TaskPriority } from "@/entities/task";
import { filterTaskColumns, type FilterableTaskColumn, type TaskFilters } from "@/features/filter-tasks";

export const taskListSortValues = ["updated", "priority", "deadline", "status"] as const;
export const taskListPageSize = 20;

export type TaskListSortValue = (typeof taskListSortValues)[number];

export type TaskListRow = {
  task: Task;
  board?: Board;
  column: Column;
  project?: Project;
};

type TaskListColumn = FilterableTaskColumn & {
  board?: Board;
  project?: Project;
};

const priorityRank: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function normalizeTaskListSort(value: string | null): TaskListSortValue {
  return taskListSortValues.includes(value as TaskListSortValue)
    ? (value as TaskListSortValue)
    : "updated";
}

export function buildTaskListColumns({
  activeBoard,
  columnsById,
  tasksById,
}: {
  activeBoard: Board | null | undefined;
  columnsById: Record<string, Column>;
  tasksById: Record<string, Task>;
}): FilterableTaskColumn[] {
  return buildBoardTaskColumns({ activeBoard, columnsById, tasksById });
}

export function buildAllTaskListColumns({
  boardsById,
  columnsById,
  currentUserId,
  isAdmin,
  projectIds,
  projectsById,
  tasksById,
}: {
  boardsById: Record<string, Board>;
  columnsById: Record<string, Column>;
  currentUserId: string | undefined;
  isAdmin: boolean;
  projectIds: string[];
  projectsById: Record<string, Project>;
  tasksById: Record<string, Task>;
}): TaskListColumn[] {
  return projectIds.flatMap((projectId) => {
    const project = projectsById[projectId];

    if (!project) {
      return [];
    }

    return project.boardIds.flatMap((boardId) => {
      const board = boardsById[boardId];

      if (!board) {
        return [];
      }

      return board.columnIds.flatMap((columnId) => {
        const column = columnsById[columnId];

        if (!column) {
          return [];
        }

        const tasks = column.taskIds
          .flatMap((taskId) => tasksById[taskId] ?? [])
          .filter((task) => isAdmin || Boolean(currentUserId && task.assigneeId === currentUserId));

        return [{ board, column, project, tasks }];
      });
    });
  });
}

export function getFilteredTaskRows({
  columns,
  filters,
  sort,
}: {
  columns: TaskListColumn[];
  filters: TaskFilters;
  sort: TaskListSortValue;
}) {
  return sortTaskRowsByProject(flattenTaskColumns(filterTaskColumns(columns, filters)), sort);
}

export function flattenTaskColumns(columns: TaskListColumn[]): TaskListRow[] {
  return columns.flatMap(({ column, tasks, ...context }) => tasks.map((task) => ({ ...context, column, task })));
}

export function sortTaskRows(rows: TaskListRow[], sort: TaskListSortValue): TaskListRow[] {
  return [...rows].sort((left, right) => {
    if (sort === "priority") {
      return priorityRank[right.task.priority] - priorityRank[left.task.priority];
    }

    if (sort === "deadline") {
      return getDateRank(left.task.deadline) - getDateRank(right.task.deadline);
    }

    if (sort === "status") {
      return left.column.name.localeCompare(right.column.name);
    }

    return getDateRank(right.task.updatedAt) - getDateRank(left.task.updatedAt);
  });
}

export function sortTaskRowsByProject(rows: TaskListRow[], sort: TaskListSortValue): TaskListRow[] {
  const rowsByProject = new Map<string, TaskListRow[]>();

  rows.forEach((row) => {
    const projectId = row.project?.id ?? "default";
    rowsByProject.set(projectId, [...(rowsByProject.get(projectId) ?? []), row]);
  });

  return Array.from(rowsByProject.values()).flatMap((projectRows) => sortTaskRows(projectRows, sort));
}

function getDateRank(value?: string) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

export function normalizeTaskListPage(value: string | null) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function paginateTaskRows(rows: TaskListRow[], page: number, pageSize = taskListPageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    rows: rows.slice(startIndex, startIndex + pageSize),
    totalPages,
  };
}
