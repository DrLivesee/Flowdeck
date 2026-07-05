import { supabase } from "@/shared/api";

type ChecklistItemRow = {
  id: string;
  completed: boolean;
  sort_order: number;
};

type TaskActivityType =
  | "task.checklistUpdated"
  | "task.commentAdded"
  | "task.commentUpdated"
  | "task.commentDeleted";

export async function addChecklistItem(input: { boardId: string; taskId: string; title: string }) {
  const title = input.title.trim();

  if (!title) {
    return;
  }

  await insertSingle("checklist_items", {
    task_id: input.taskId,
    title,
    completed: false,
    sort_order: await getNextChecklistSortOrder(input.taskId),
  });
  await recordTaskActivity(input.taskId, "task.checklistUpdated", "Checklist updated");
}

export async function renameChecklistItem(input: { boardId: string; checklistItemId: string; taskId: string; title: string }) {
  const title = input.title.trim();

  if (!title) {
    return;
  }

  await updateById("checklist_items", input.checklistItemId, { title });
  await recordTaskActivity(input.taskId, "task.checklistUpdated", "Checklist updated");
}

export async function toggleChecklistItem(input: { boardId: string; checklistItemId: string; taskId: string }) {
  const item = await getChecklistItem(input.checklistItemId);

  await updateById("checklist_items", input.checklistItemId, { completed: !item.completed });
  await recordTaskActivity(input.taskId, "task.checklistUpdated", "Checklist updated");
}

export async function deleteChecklistItem(input: { boardId: string; checklistItemId: string; taskId: string }) {
  await deleteById("checklist_items", input.checklistItemId);
  await recordTaskActivity(input.taskId, "task.checklistUpdated", "Checklist updated");
}

export async function addTaskComment(input: { boardId: string; message: string; taskId: string }) {
  const message = input.message.trim();
  const userId = await getCurrentUserId();

  if (!message) {
    return;
  }

  await insertSingle("task_comments", {
    task_id: input.taskId,
    author_id: userId,
    message,
  });
  await recordTaskActivity(input.taskId, "task.commentAdded", "Comment added");
}

export async function editTaskComment(input: { boardId: string; commentId: string; message: string; taskId: string }) {
  const message = input.message.trim();

  if (!message) {
    return;
  }

  await updateById("task_comments", input.commentId, { message });
  await recordTaskActivity(input.taskId, "task.commentUpdated", "Comment updated");
}

export async function deleteTaskComment(input: { boardId: string; commentId: string; taskId: string }) {
  await deleteById("task_comments", input.commentId);
  await recordTaskActivity(input.taskId, "task.commentDeleted", "Comment deleted");
}

async function recordTaskActivity(taskId: string, type: TaskActivityType, message: string) {
  await insertSingle("activity_events", { task_id: taskId, type, message });
  await updateById("tasks", taskId, { updated_at: new Date().toISOString() });
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Cannot add a comment without an authenticated user.");
  }

  return data.user.id;
}

async function getChecklistItem(checklistItemId: string) {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id,completed,sort_order")
    .eq("id", checklistItemId)
    .single<ChecklistItemRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function getNextChecklistSortOrder(taskId: string) {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id,completed,sort_order")
    .eq("task_id", taskId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<ChecklistItemRow[]>();

  if (error) {
    throw error;
  }

  return (data?.[0]?.sort_order ?? 0) + 100;
}

async function insertSingle(table: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(values);

  if (error) {
    throw error;
  }
}

async function updateById(table: string, id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(values).eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteById(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    throw error;
  }
}
