import type { Column } from "@/entities/column";
import type { Task } from "@/entities/task";

import type { Board } from "./types";

export type BoardTaskColumn = {
  column: Column;
  tasks: Task[];
};

export function withBoardColumns(
  board: Board | null | undefined,
  columnsById: Record<string, Pick<Column, "boardId" | "id">>,
): Board | null {
  if (!board) {
    return null;
  }

  return {
    ...board,
    columnIds: Object.values(columnsById)
      .filter((column) => column.boardId === board.id)
      .map((column) => column.id),
  };
}

export function buildBoardTaskColumns({
  activeBoard,
  columnsById,
  tasksById,
}: {
  activeBoard: Board | null | undefined;
  columnsById: Record<string, Column>;
  tasksById: Record<string, Task>;
}): BoardTaskColumn[] {
  if (!activeBoard) {
    return [];
  }

  return activeBoard.columnIds.flatMap((columnId) => {
    const column = columnsById[columnId];

    if (!column) {
      return [];
    }

    return [
      {
        column,
        tasks: column.taskIds.flatMap((taskId) => {
          const task = tasksById[taskId];

          return task ? [task] : [];
        }),
      },
    ];
  });
}
