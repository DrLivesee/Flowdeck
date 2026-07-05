import type { Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { Task, TaskPriority } from "@/entities/task";

export type AnalyticsTaskRow = {
  column: Column;
  task: Task;
};

export type AnalyticsBreakdownItem = {
  id: string;
  label: string;
  count: number;
  ratio: number;
};

export type AnalyticsView = {
  checklistRatio: number;
  columnBreakdown: AnalyticsBreakdownItem[];
  completedTasks: number;
  completionRatio: number;
  overdueTasks: number;
  priorityBreakdown: Array<AnalyticsBreakdownItem & { priority: TaskPriority }>;
  recentTasks: AnalyticsTaskRow[];
  totalTasks: number;
  updatedToday: number;
};

const priorities: TaskPriority[] = ["urgent", "high", "medium", "low"];

export function buildAnalyticsView({
  activeBoard,
  columnsById,
  tasksById,
  now = new Date(),
}: {
  activeBoard: Board | null | undefined;
  columnsById: Record<string, Column>;
  tasksById: Record<string, Task>;
  now?: Date;
}): AnalyticsView {
  const rows = getBoardTaskRows({ activeBoard, columnsById, tasksById });
  const totalTasks = rows.length;
  const completedTasks = rows.filter(({ column, task }) => isTaskCompleted(task, column)).length;
  const checklistTotals = getChecklistTotals(rows.map(({ task }) => task));

  return {
    checklistRatio: checklistTotals.total > 0 ? checklistTotals.completed / checklistTotals.total : 0,
    columnBreakdown: getColumnBreakdown(activeBoard, columnsById, tasksById, totalTasks),
    completedTasks,
    completionRatio: totalTasks > 0 ? completedTasks / totalTasks : 0,
    overdueTasks: rows.filter(({ column, task }) => isTaskOverdue(task, column, now)).length,
    priorityBreakdown: getPriorityBreakdown(rows.map(({ task }) => task), totalTasks),
    recentTasks: [...rows]
      .sort((left, right) => getDateRank(right.task.updatedAt) - getDateRank(left.task.updatedAt))
      .slice(0, 5),
    totalTasks,
    updatedToday: rows.filter(({ task }) => isSameDay(task.updatedAt, now)).length,
  };
}

function getBoardTaskRows({
  activeBoard,
  columnsById,
  tasksById,
}: {
  activeBoard: Board | null | undefined;
  columnsById: Record<string, Column>;
  tasksById: Record<string, Task>;
}): AnalyticsTaskRow[] {
  if (!activeBoard) {
    return [];
  }

  return activeBoard.columnIds.flatMap((columnId) => {
    const column = columnsById[columnId];

    if (!column) {
      return [];
    }

    return column.taskIds.flatMap((taskId) => {
      const task = tasksById[taskId];

      return task ? [{ column, task }] : [];
    });
  });
}

function getColumnBreakdown(
  activeBoard: Board | null | undefined,
  columnsById: Record<string, Column>,
  tasksById: Record<string, Task>,
  totalTasks: number,
): AnalyticsBreakdownItem[] {
  if (!activeBoard) {
    return [];
  }

  return activeBoard.columnIds.flatMap((columnId) => {
    const column = columnsById[columnId];

    if (!column) {
      return [];
    }

    const count = column.taskIds.filter((taskId) => Boolean(tasksById[taskId])).length;

    return [{ id: column.id, label: column.name, count, ratio: getRatio(count, totalTasks) }];
  });
}

function getPriorityBreakdown(tasks: Task[], totalTasks: number) {
  return priorities.map((priority) => {
    const count = tasks.filter((task) => task.priority === priority).length;

    return { id: priority, label: priority, priority, count, ratio: getRatio(count, totalTasks) };
  });
}

function getChecklistTotals(tasks: Task[]) {
  return tasks.reduce(
    (result, task) => ({
      completed: result.completed + task.checklist.filter((item) => item.completed).length,
      total: result.total + task.checklist.length,
    }),
    { completed: 0, total: 0 },
  );
}

function isTaskCompleted(task: Task, column: Column) {
  return Boolean(task.completedAt || column.final);
}

function isTaskOverdue(task: Task, column: Column, now: Date) {
  return Boolean(task.deadline && !isTaskCompleted(task, column) && new Date(task.deadline) < now);
}

function isSameDay(date: string, now: Date) {
  return new Date(date).toDateString() === now.toDateString();
}

function getDateRank(value: string) {
  return new Date(value).getTime();
}

function getRatio(count: number, total: number) {
  return total > 0 ? count / total : 0;
}
