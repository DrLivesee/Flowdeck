import type { Board } from "@/entities/board";
import type { Column } from "@/entities/column";
import type { TagColor } from "@/entities/tag";
import { supabase } from "@/shared/api";

const defaultColumnNames = ["Бэклог", "В работе", "На проверке", "Готово"];
const defaultColumnAccents = ["slate", "cyan", "violet", "emerald"] as const satisfies readonly Column["accent"][];

type ProjectRow = { id: string };
type BoardRow = { id: string; project_id: string };
type CreateProjectWithMembersRow = { board_id: string; project_id: string };
type ColumnRow = {
  id: string;
  board_id: string;
  name: string;
  accent: Column["accent"];
  final: boolean;
  sort_order: number;
};
type TaskSortRow = { id: string; sort_order: number };
type SortableRow = { id: string; sort_order: number };

export async function createProjectWithDefaultBoard(input: { defaultBoardName?: string; defaultColumnNames?: string[]; description?: string; name: string }) {
  const project = await insertSingle<ProjectRow>("projects", {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    sort_order: await getNextSortOrder("projects"),
  });
  const board = await createBoardWithDefaultColumns({
    projectId: project.id,
    name: input.defaultBoardName ?? "Основная доска",
    defaultColumnNames: input.defaultColumnNames,
  });

  return { projectId: project.id, boardId: board.boardId };
}

export async function createProjectWithMembers(input: { defaultBoardName?: string; defaultColumnNames?: string[]; description?: string; memberIds: string[]; name: string }) {
  const response = await supabase
    .rpc("create_project_with_members", {
      p_default_board_name: input.defaultBoardName ?? "Основная доска",
      p_default_column_names: input.defaultColumnNames ?? defaultColumnNames,
      p_description: input.description?.trim() || null,
      p_member_ids: input.memberIds,
      p_name: input.name.trim(),
    })
    .returns<unknown>();

  if (response.error) throw response.error;

  const rows = response.data;

  if (!isCreateProjectWithMembersRows(rows)) {
    throw new Error("Project creation RPC returned an unexpected result.");
  }

  const result = rows[0];

  if (!result) {
    throw new Error("Project creation RPC returned no result.");
  }

  return { boardId: result.board_id, projectId: result.project_id };
}

export async function updateProjectMembers(input: { memberIds: string[]; projectId: string }) {
  const { error } = await supabase.rpc("update_project_members", {
    p_member_ids: input.memberIds,
    p_project_id: input.projectId,
  });

  if (error) throw error;
}

export async function renameProject(input: { description?: string; name: string; projectId: string }) {
  await updateById("projects", input.projectId, {
    name: input.name.trim(),
    description: input.description?.trim() || null,
  });
}

export async function archiveProject(input: { archivedAt?: string; projectId: string }) {
  await updateById("projects", input.projectId, {
    archived_at: input.archivedAt ? null : new Date().toISOString(),
  });
}

export async function deleteProject(projectId: string) {
  await deleteById("projects", projectId);
}

export async function reorderProjects(input: { projectIds: string[] }) {
  await updateSortOrders("projects", input.projectIds);
}

export async function reorderProjectMemberships(input: { projectIds: string[] }) {
  const { error } = await supabase.rpc("reorder_project_memberships", {
    p_project_ids: input.projectIds,
  });

  if (error) throw error;
}

export async function createBoardWithDefaultColumns(input: { defaultColumnNames?: string[]; name: string; projectId: string }) {
  const board = await insertSingle<BoardRow>("boards", {
    project_id: input.projectId,
    name: input.name.trim(),
    sort_order: await getNextSortOrder("boards", "project_id", input.projectId),
  });
  await insertDefaultColumns(board.id, input.defaultColumnNames);

  return { boardId: board.id, projectId: board.project_id };
}

export async function renameBoard(input: { boardId: string; name: string }) {
  await updateById("boards", input.boardId, { name: input.name.trim() });
}

export async function deleteBoard(boardId: string) {
  await deleteById("boards", boardId);
}

export async function reorderBoards(input: { boards: Board[]; boardId: string; targetIndex: number }) {
  await updateSortOrders("boards", insertId(input.boards.map((board) => board.id), input.boardId, input.targetIndex));
}

export async function createColumn(input: { accent: Column["accent"]; boardId: string; name: string }) {
  await insertSingle<ColumnRow>("columns", {
    board_id: input.boardId,
    name: input.name.trim(),
    accent: input.accent,
    final: false,
    sort_order: await getNextSortOrder("columns", "board_id", input.boardId),
  });
  await syncFinalColumn(input.boardId);
}

export async function renameColumn(input: { boardId: string; columnId: string; name: string }) {
  await updateById("columns", input.columnId, { name: input.name.trim() });
}

export async function deleteColumn(input: { boardId: string; columnId: string }) {
  const columns = await getColumns(input.boardId);

  if (columns.length <= 1) {
    throw new Error("Cannot delete the last board column.");
  }

  const fallbackColumn = columns.find((column) => column.id !== input.columnId);

  if (!fallbackColumn) {
    throw new Error("Could not find a fallback column.");
  }

  const movedTasks = await selectRows<TaskSortRow>("tasks", "id,sort_order", "column_id", input.columnId);
  const fallbackSortOrder = await getNextSortOrder("tasks", "column_id", fallbackColumn.id);

  await Promise.all(
    movedTasks.map((task, index) =>
      updateById("tasks", task.id, {
        column_id: fallbackColumn.id,
        sort_order: fallbackSortOrder + index * 100,
      }),
    ),
  );
  await deleteById("columns", input.columnId);
  await syncFinalColumn(input.boardId);
}

export async function reorderColumns(input: { boardId: string; columnId: string; targetIndex: number }) {
  const columns = await getColumns(input.boardId);
  const columnIds = insertId(columns.map((column) => column.id), input.columnId, input.targetIndex);

  await updateSortOrders("columns", columnIds);
  await syncFinalColumn(input.boardId);
}

export async function createTag(input: { color: TagColor; name: string }) {
  await insertSingle("tags", { name: input.name.trim(), color: input.color });
}

export async function renameTag(input: { color: TagColor; name: string; tagId: string }) {
  await updateById("tags", input.tagId, { name: input.name.trim(), color: input.color });
}

export async function deleteTag(tagId: string) {
  await deleteById("tags", tagId);
}

async function insertDefaultColumns(boardId: string, columnNames = defaultColumnNames) {
  const { error } = await supabase.from("columns").insert(
    columnNames.map((name, index) => ({
      board_id: boardId,
      name,
      accent: defaultColumnAccents[index],
      final: index === columnNames.length - 1,
      sort_order: (index + 1) * 100,
    })),
  );

  if (error) throw error;
}

async function syncFinalColumn(boardId: string) {
  const columns = await getColumns(boardId);
  const finalColumnId = columns.at(-1)?.id;
  const now = new Date().toISOString();

  await Promise.all(columns.map((column) => updateById("columns", column.id, { final: column.id === finalColumnId })));
  await Promise.all(columns.map((column) => updateTasksCompletion(column.id, column.id === finalColumnId ? now : null)));
}

async function updateTasksCompletion(columnId: string, completedAt: string | null) {
  const { error } = await supabase.from("tasks").update({ completed_at: completedAt }).eq("column_id", columnId);

  if (error) throw error;
}

async function getColumns(boardId: string) {
  const columns = await selectRows<ColumnRow>("columns", "id,board_id,name,accent,final,sort_order", "board_id", boardId);

  return columns.sort((left, right) => left.sort_order - right.sort_order);
}

async function getNextSortOrder(table: string, filterColumn?: string, filterValue?: string) {
  let query = supabase.from(table).select("id,sort_order");

  if (filterColumn && filterValue) {
    query = query.eq(filterColumn, filterValue);
  }

  const { data, error } = await query.order("sort_order", { ascending: false }).limit(1).returns<SortableRow[]>();

  if (error) throw error;

  return (data?.[0]?.sort_order ?? 0) + 100;
}

async function selectRows<TRow>(table: string, columns: string, filterColumn: string, filterValue: string) {
  const { data, error } = await supabase.from(table).select(columns).eq(filterColumn, filterValue).returns<TRow[]>();

  if (error) throw error;

  return data ?? [];
}

async function insertSingle<TRow>(table: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(values).select().single<TRow>();

  if (error) throw error;

  return data;
}

async function updateById(table: string, id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(values).eq("id", id);

  if (error) throw error;
}

async function deleteById(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) throw error;
}

async function updateSortOrders(table: string, ids: string[]) {
  await Promise.all(ids.map((id, index) => updateById(table, id, { sort_order: (index + 1) * 100 })));
}

function insertId(ids: string[], id: string, targetIndex: number) {
  const withoutId = ids.filter((currentId) => currentId !== id);
  const safeIndex = Math.max(0, Math.min(targetIndex, withoutId.length));

  return [...withoutId.slice(0, safeIndex), id, ...withoutId.slice(safeIndex)];
}

function isCreateProjectWithMembersRows(value: unknown): value is CreateProjectWithMembersRow[] {
  return Array.isArray(value) && value.every(isCreateProjectWithMembersRow);
}

function isCreateProjectWithMembersRow(value: unknown): value is CreateProjectWithMembersRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;

  return typeof row.board_id === "string" && typeof row.project_id === "string";
}
