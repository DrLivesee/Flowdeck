import type { Task, TaskId } from "@/entities/task";
import type { Tag } from "@/entities/tag";
import type { TaskDropColumn, TaskDropTarget } from "@/features/move-task";

import type { KanbanColumnView } from "./types";

export function getKanbanColumnsById(columns: KanbanColumnView[]) {
  return Object.fromEntries(
    columns.map(({ column }) => [column.id, { id: column.id, taskIds: column.taskIds }]),
  ) as Record<string, TaskDropColumn>;
}

export function getKanbanTasksById(columns: KanbanColumnView[]) {
  return Object.fromEntries(
    columns.flatMap(({ tasks }) => tasks.map((task) => [task.id, task])),
  ) as Record<TaskId, Task>;
}

export function getTaskTags(task: Task, tagsById: Record<string, Tag>) {
  return task.tagIds.flatMap((tagId) => {
    const tag = tagsById[tagId];

    return tag ? [tag] : [];
  });
}

export function getTaskDropTarget(value: unknown): TaskDropTarget | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<TaskDropTarget>;

  if (data.type === "column" && typeof data.columnId === "string") {
    return {
      type: "column",
      columnId: data.columnId,
    };
  }

  if (data.type === "task" && typeof data.taskId === "string" && typeof data.columnId === "string") {
    return {
      type: "task",
      taskId: data.taskId,
      columnId: data.columnId,
    };
  }

  return null;
}
