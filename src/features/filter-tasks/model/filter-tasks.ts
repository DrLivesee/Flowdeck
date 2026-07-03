import type { Column } from "@/entities/column";
import type { Task, TaskPriority } from "@/entities/task";
import { toISODate } from "@/shared/lib";

export const taskFilterSearchParams = {
  completion: "done",
  deadline: "due",
  priority: "priority",
  search: "q",
  tag: "tag",
} as const;

export const taskPriorities = ["low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];
export const deadlineFilterValues = ["all", "overdue", "today", "week", "none"] as const;
export const completionFilterValues = ["all", "open", "completed"] as const;

export type DeadlineFilterValue = (typeof deadlineFilterValues)[number];
export type CompletionFilterValue = (typeof completionFilterValues)[number];

export type TaskFilters = {
  search: string;
  priority: TaskPriority | "all";
  tagId: string;
  deadline: DeadlineFilterValue;
  completion: CompletionFilterValue;
};

export type FilterableTaskColumn = {
  column: Column;
  tasks: Task[];
};

type TaskFilterContext = {
  normalizedSearch: string;
  today: string;
  weekEnd: string;
};

export function getTaskFiltersFromSearchParams(searchParams: URLSearchParams): TaskFilters {
  return {
    search: searchParams.get(taskFilterSearchParams.search)?.trim() ?? "",
    priority: normalizePriorityFilter(searchParams.get(taskFilterSearchParams.priority)),
    tagId: searchParams.get(taskFilterSearchParams.tag)?.trim() || "all",
    deadline: normalizeDeadlineFilter(searchParams.get(taskFilterSearchParams.deadline)),
    completion: normalizeCompletionFilter(searchParams.get(taskFilterSearchParams.completion)),
  };
}

export function deleteTaskFilterSearchParams(searchParams: URLSearchParams) {
  Object.values(taskFilterSearchParams).forEach((paramName) => searchParams.delete(paramName));
}

export function hasActiveTaskFilters(filters: TaskFilters) {
  return (
    filters.search.length > 0 ||
    filters.priority !== "all" ||
    filters.tagId !== "all" ||
    filters.deadline !== "all" ||
    filters.completion !== "all"
  );
}

export function filterTaskColumns<TColumn extends FilterableTaskColumn>(
  columns: TColumn[],
  filters: TaskFilters,
  now = new Date(),
): TColumn[] {
  const context = createTaskFilterContext(filters, now);

  return columns.map((item) => ({
    ...item,
    tasks: item.tasks.filter((task) => isTaskMatchingFilters(task, item.column, filters, context)),
  }));
}

export function countTasksInColumns(columns: readonly FilterableTaskColumn[]) {
  return columns.reduce((total, column) => total + column.tasks.length, 0);
}

function isTaskMatchingFilters(
  task: Task,
  column: Column,
  filters: TaskFilters,
  context: TaskFilterContext,
) {
  return (
    matchesSearch(task, context.normalizedSearch) &&
    matchesPriority(task, filters.priority) &&
    matchesTag(task, filters.tagId) &&
    matchesDeadline(task, filters.deadline, context) &&
    matchesCompletion(task, column, filters.completion)
  );
}

function matchesSearch(task: Task, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  return [task.title, task.description ?? ""].some((value) =>
    value.toLocaleLowerCase().includes(normalizedSearch),
  );
}

function matchesPriority(task: Task, priority: TaskFilters["priority"]) {
  return priority === "all" || task.priority === priority;
}

function matchesTag(task: Task, tagId: TaskFilters["tagId"]) {
  return tagId === "all" || task.tagIds.includes(tagId);
}

function matchesDeadline(task: Task, deadline: DeadlineFilterValue, context: TaskFilterContext) {
  if (deadline === "all") {
    return true;
  }

  if (!task.deadline) {
    return deadline === "none";
  }

  const taskDate = task.deadline.slice(0, 10);

  if (deadline === "overdue") {
    return taskDate < context.today;
  }

  if (deadline === "today") {
    return taskDate === context.today;
  }

  if (deadline === "week") {
    return taskDate >= context.today && taskDate <= context.weekEnd;
  }

  return false;
}

function createTaskFilterContext(filters: TaskFilters, now: Date): TaskFilterContext {
  return {
    normalizedSearch: filters.search.toLocaleLowerCase(),
    today: toISODate(now),
    weekEnd: toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
  };
}

function matchesCompletion(task: Task, column: Column, completion: CompletionFilterValue) {
  if (completion === "all") {
    return true;
  }

  const isCompleted = Boolean(task.completedAt || column.final);

  return completion === "completed" ? isCompleted : !isCompleted;
}

function normalizePriorityFilter(value: string | null): TaskFilters["priority"] {
  return taskPriorities.includes(value as TaskPriority) ? (value as TaskPriority) : "all";
}

function normalizeDeadlineFilter(value: string | null): DeadlineFilterValue {
  return deadlineFilterValues.includes(value as DeadlineFilterValue)
    ? (value as DeadlineFilterValue)
    : "all";
}

function normalizeCompletionFilter(value: string | null): CompletionFilterValue {
  return completionFilterValues.includes(value as CompletionFilterValue)
    ? (value as CompletionFilterValue)
    : "all";
}
