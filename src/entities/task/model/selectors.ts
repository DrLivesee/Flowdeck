import type { Task } from "./types";

export function selectChecklistProgress(task: Task) {
  const total = task.checklist.length;
  const completed = task.checklist.filter((item) => item.completed).length;

  return {
    completed,
    total,
    ratio: total > 0 ? completed / total : 0,
  };
}
