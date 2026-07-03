import type { Board } from "@/entities/board";

export type OptimisticColumnOrder = {
  boardId: string;
  columnIds: string[];
};

export function applyOptimisticColumnOrder(
  board: Board | null,
  optimisticColumnOrder: OptimisticColumnOrder | null,
): Board | null {
  if (!board || optimisticColumnOrder?.boardId !== board.id) {
    return board;
  }

  const currentIds = new Set(board.columnIds);
  const orderedIds = optimisticColumnOrder.columnIds.filter((columnId) => currentIds.has(columnId));
  const missingIds = board.columnIds.filter((columnId) => !orderedIds.includes(columnId));

  return { ...board, columnIds: [...orderedIds, ...missingIds] };
}

export function insertId(ids: string[], id: string, targetIndex: number) {
  const withoutId = ids.filter((currentId) => currentId !== id);
  const safeIndex = Math.max(0, Math.min(targetIndex, withoutId.length));

  return [...withoutId.slice(0, safeIndex), id, ...withoutId.slice(safeIndex)];
}
