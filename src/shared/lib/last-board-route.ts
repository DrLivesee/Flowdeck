const legacyLastBoardRouteStorageKey = "projectflow.lastBoardRoute";
const lastBoardRouteStorageKey = "flowdeck.lastBoardRoute";

export type LastBoardRoute = {
  boardId: string;
  projectId: string;
};

export function readLastBoardRoute() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(lastBoardRouteStorageKey) ?? window.sessionStorage.getItem(legacyLastBoardRouteStorageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as LastBoardRoute;
  } catch {
    return null;
  }
}

export function writeLastBoardRoute(route: LastBoardRoute) {
  window.sessionStorage.setItem(lastBoardRouteStorageKey, JSON.stringify(route));
}

export function getStoredBoardId(boardsById: Record<string, { projectId: string }>) {
  const route = readLastBoardRoute();

  return route?.boardId && boardsById[route.boardId]?.projectId === route.projectId
    ? route.boardId
    : null;
}
