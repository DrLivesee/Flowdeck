import type { Project } from "@/entities/project";

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string;
  boardCount: number;
  taskCount: number;
  completedCount: number;
  archived: boolean;
};

export type BoardHeaderStats = {
  activeTasks: number;
  completedThisWeek: number;
  completionRatio: number;
};

export function buildProjectSummaries({
  projectIds,
  projectsById,
  projectTaskStatsById,
}: {
  projectIds: string[];
  projectsById: Record<string, Project>;
  projectTaskStatsById: Record<string, { completedCount: number; taskCount: number }>;
}): ProjectSummary[] {
  return projectIds.flatMap((projectId) => {
    const project = projectsById[projectId];

    if (!project) {
      return [];
    }

    const stats = projectTaskStatsById[project.id] ?? { completedCount: 0, taskCount: 0 };

    return [
      {
        id: project.id,
        name: project.name,
        description: project.description,
        boardCount: project.boardIds.length,
        taskCount: stats.taskCount,
        completedCount: stats.completedCount,
        archived: Boolean(project.archivedAt),
      },
    ];
  });
}
