import type { BoardId } from "@/entities/board";

export type ColumnId = string;

export type Column = {
  id: ColumnId;
  boardId: BoardId;
  name: string;
  accent: "amber" | "blue" | "cyan" | "emerald" | "fuchsia" | "rose" | "slate" | "violet";
  final: boolean;
  taskIds: string[];
};
