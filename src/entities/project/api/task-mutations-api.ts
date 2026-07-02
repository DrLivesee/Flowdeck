import type { TaskPriority } from "@/entities/task";
import { supabase } from "@/shared/api";

type CreateTaskInput = {
  assigneeId?: string;
  boardId: string;
  columnId: string;
  deadline?: string;
  description?: string;
  priority: TaskPriority;
  tagIds: string[];
  title: string;
};

type UpdateTaskInput = {
  assigneeId?: string;
  boardId: string;
  deadline?: string;
  description?: string;
  priority: TaskPriority;
  tagIds: string[];
  targetColumnId?: string;
  taskId: string;
  title: string;
};

export async function createTask(input: CreateTaskInput) {
  const response = await supabase.rpc("create_task_with_relations", {
    p_assignee_id: input.assigneeId || null,
    p_board_id: input.boardId,
    p_column_id: input.columnId,
    p_deadline: input.deadline || null,
    p_description: input.description ?? null,
    p_priority: input.priority,
    p_tag_ids: input.tagIds,
    p_title: input.title,
  });

  if (response.error) {
    throw response.error;
  }

  return response.data as string;
}

export async function updateTask(input: UpdateTaskInput) {
  const { error } = await supabase.rpc("update_task_with_relations_and_optional_move", {
    p_assignee_id: input.assigneeId || null,
    p_deadline: input.deadline || null,
    p_description: input.description ?? null,
    p_priority: input.priority,
    p_tag_ids: input.tagIds,
    p_target_column_id: input.targetColumnId ?? null,
    p_task_id: input.taskId,
    p_title: input.title,
  });

  if (error) {
    throw error;
  }
}

export async function deleteTask(input: { boardId: string; taskId: string }) {
  const { error } = await supabase.from("tasks").delete().eq("id", input.taskId);

  if (error) {
    throw error;
  }
}

export async function moveTask(input: { boardId: string; targetColumnId: string; targetIndex?: number; taskId: string }) {
  const { error } = await supabase.rpc("move_task_with_sort", {
    p_target_column_id: input.targetColumnId,
    p_target_index: input.targetIndex ?? null,
    p_task_id: input.taskId,
  });

  if (error) {
    throw error;
  }
}

export async function reorderTask(input: { boardId: string; columnId: string; targetIndex: number; taskId: string }) {
  const { error } = await supabase.rpc("reorder_task_in_column", {
    p_column_id: input.columnId,
    p_target_index: input.targetIndex,
    p_task_id: input.taskId,
  });

  if (error) {
    throw error;
  }
}
