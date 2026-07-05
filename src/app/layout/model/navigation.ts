import { BarChart3, KanbanSquare, ListTodo, Settings } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  labelKey: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
};

export const navigationItems: NavigationItem[] = [
  { labelKey: "navigation.board", to: "/board", icon: KanbanSquare },
  { labelKey: "navigation.tasks", to: "/tasks", icon: ListTodo },
  { labelKey: "navigation.analytics", to: "/analytics", icon: BarChart3 },
  { labelKey: "navigation.settings", to: "/settings", icon: Settings },
];

export function getBoardPath(projectId?: string | null, boardId?: string | null) {
  return projectId && boardId ? `/projects/${projectId}/boards/${boardId}` : "/board";
}

export function getNavigationItems(boardPath: string, options: { canViewAnalytics?: boolean } = {}): NavigationItem[] {
  return navigationItems
    .filter((item) => item.labelKey !== "navigation.analytics" || options.canViewAnalytics)
    .map((item) =>
      item.labelKey === "navigation.board" ? { ...item, to: boardPath } : item,
    );
}
