import type { ProjectId } from "@/entities/project";

export type BoardId = string;

export type Board = {
  id: BoardId;
  projectId: ProjectId;
  name: string;
  columnIds: string[];
  createdAt: string;
  updatedAt: string;
};
