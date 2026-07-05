import type { Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { Task, TaskPriority } from "@/entities/task";

export function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    projectId: "project-1",
    name: "Board",
    columnIds: ["column-open", "column-done"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: "column-open",
    boardId: "board-1",
    name: "Open",
    accent: "cyan",
    final: false,
    taskIds: [],
    ...overrides,
  };
}

export function createTask(overrides: Partial<Task> = {}): Task {
  const priority: TaskPriority = overrides.priority ?? "medium";

  return {
    id: "task-1",
    boardId: "board-1",
    columnId: "column-open",
    title: "Task",
    description: undefined,
    priority,
    tagIds: [],
    checklist: [],
    commentIds: [],
    activityIds: [],
    deadline: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completedAt: undefined,
    ...overrides,
  };
}
