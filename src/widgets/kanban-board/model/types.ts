import type { Column } from "@/entities/column";
import type { Task } from "@/entities/task";

export type KanbanColumnView = {
  column: Column;
  tasks: Task[];
};
