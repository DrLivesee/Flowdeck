import type { Board } from "@/entities/board";

export function getRouteBoard({
  activeBoardId,
  boardId,
  boardsById,
  projectId,
}: {
  activeBoardId?: string | null;
  boardId?: string;
  boardsById: Record<string, Board>;
  projectId?: string;
}) {
  if (projectId && boardId && boardsById[boardId]?.projectId === projectId) {
    return boardsById[boardId];
  }

  return activeBoardId ? boardsById[activeBoardId] ?? null : null;
}
