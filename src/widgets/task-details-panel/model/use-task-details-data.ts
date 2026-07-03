import { useMemo } from "react";

import type { ActivityEvent, Task, TaskComment } from "@/entities/task";

export function useTaskComments(task: Task, commentsById: Record<string, TaskComment>) {
  return useMemo(
    () => task.commentIds.flatMap((commentId) => commentsById[commentId] ?? []),
    [commentsById, task.commentIds],
  );
}

export function useTaskActivityEvents(task: Task, activityById: Record<string, ActivityEvent>) {
  return useMemo(
    () => task.activityIds.flatMap((activityId) => activityById[activityId] ?? []).slice().reverse(),
    [activityById, task.activityIds],
  );
}
