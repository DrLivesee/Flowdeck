import { appLimits } from "../config";

type Translate = (key: string, options?: Record<string, number>) => string;

const limitErrorMatchers = [
  {
    limit: appLimits.projectsTotal,
    marker: "Project limit reached",
    translationKey: "limits.projectsTotal",
  },
  {
    limit: appLimits.boardsPerProject,
    marker: "Board limit reached",
    translationKey: "limits.boardsPerProject",
  },
  {
    limit: appLimits.columnsPerBoard,
    marker: "Column limit reached",
    translationKey: "limits.columnsPerBoard",
  },
  {
    limit: appLimits.tasksPerBoard,
    marker: "Task limit reached",
    translationKey: "limits.tasksPerBoard",
  },
  {
    limit: appLimits.tagsTotal,
    marker: "Tag limit reached",
    translationKey: "limits.tagsTotal",
  },
] as const;

export function getAppLimitErrorMessage(error: unknown, t: Translate) {
  const message = getErrorMessage(error);

  if (!message) {
    return null;
  }

  const match = limitErrorMatchers.find((item) => message.includes(item.marker));

  return match ? t(match.translationKey, { limit: match.limit }) : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;

    return typeof message === "string" ? message : null;
  }

  return null;
}
