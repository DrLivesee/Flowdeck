import { z } from "zod";

import type { Task, TaskPriority } from "@/entities/task";
import { toISODate } from "@/shared/lib";

export const priorities = ["low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];

export function createTaskDetailsSchema(t: (key: string) => string) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t("taskDetails.validation.titleRequired"))
      .max(120, t("taskDetails.validation.titleMax")),
    description: z.string().max(600, t("taskDetails.validation.descriptionMax")),
    columnId: z.string().min(1),
    assigneeId: z.string(),
    priority: z.enum(priorities),
    deadline: z.string(),
    tagIds: z.array(z.string()),
  });
}

export type TaskDetailsFormValues = z.infer<ReturnType<typeof createTaskDetailsSchema>>;

export function getTaskFormValues(task: Task): TaskDetailsFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    columnId: task.columnId,
    assigneeId: task.assigneeId ?? "",
    priority: task.priority,
    deadline: task.deadline ? toISODate(new Date(task.deadline)) : "",
    tagIds: task.tagIds,
  };
}
