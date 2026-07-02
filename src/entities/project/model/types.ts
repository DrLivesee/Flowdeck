export type ProjectId = string;

export type Project = {
  id: ProjectId;
  name: string;
  description?: string;
  boardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};
