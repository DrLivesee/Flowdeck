import { buildBoardTaskColumns, type Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { Task } from "@/entities/task";
import type { KanbanColumnView } from "@/widgets/kanban-board";

export type BoardStats = {
  totalColumns: number;
  totalTasks: number;
  completionRatio: number;
};

export function buildBoardColumns({
  activeBoard,
  columnsById,
  tasksById,
}: {
  activeBoard: Board | null | undefined;
  columnsById: Record<string, Column>;
  tasksById: Record<string, Task>;
}): KanbanColumnView[] {
  return buildBoardTaskColumns({ activeBoard, columnsById, tasksById });
}

export function getBoardStats(boardColumns: KanbanColumnView[]): BoardStats {
  const stats = boardColumns.reduce(
    (result, column) => {
      const completedTasks = column.tasks.filter((task) => task.completedAt || column.column.final).length;

      return {
        completedTasks: result.completedTasks + completedTasks,
        totalTasks: result.totalTasks + column.tasks.length,
      };
    },
    { completedTasks: 0, totalTasks: 0 },
  );

  return {
    totalColumns: boardColumns.length,
    totalTasks: stats.totalTasks,
    completionRatio: stats.totalTasks > 0 ? stats.completedTasks / stats.totalTasks : 0,
  };
}
