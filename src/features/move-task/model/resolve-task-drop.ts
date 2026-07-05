import type { ColumnId } from "@/entities/column";
import type { TaskId } from "@/entities/task";

export type TaskDropTarget =
  | {
      type: "column";
      columnId: ColumnId;
    }
  | {
      type: "task";
      taskId: TaskId;
      columnId: ColumnId;
    };

export type TaskDropColumn = {
  id: ColumnId;
  taskIds: TaskId[];
};

export type TaskDropResult =
  | {
      type: "move";
      taskId: TaskId;
      targetColumnId: ColumnId;
      targetIndex: number;
    }
  | {
      type: "reorder";
      taskId: TaskId;
      targetIndex: number;
    };

type ResolveTaskDropInput = {
  activeTaskId: TaskId;
  activeColumnId: ColumnId;
  overTarget: TaskDropTarget;
  columnsById: Record<ColumnId, TaskDropColumn>;
};

export function resolveTaskDrop({
  activeTaskId,
  activeColumnId,
  overTarget,
  columnsById,
}: ResolveTaskDropInput): TaskDropResult | null {
  const targetColumnId = overTarget.columnId;
  const targetColumn = columnsById[targetColumnId];

  if (!targetColumn) {
    return null;
  }

  const targetIndex =
    overTarget.type === "task"
      ? targetColumn.taskIds.indexOf(overTarget.taskId)
      : targetColumn.taskIds.length;

  if (targetIndex < 0) {
    return null;
  }

  if (targetColumnId === activeColumnId) {
    const activeIndex = targetColumn.taskIds.indexOf(activeTaskId);

    if (activeIndex === -1 || activeIndex === targetIndex) {
      return null;
    }

    return {
      type: "reorder",
      taskId: activeTaskId,
      targetIndex,
    };
  }

  return {
    type: "move",
    taskId: activeTaskId,
    targetColumnId,
    targetIndex,
  };
}
