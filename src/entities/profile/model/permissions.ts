import type { Task } from "@/entities/task";

import type { Profile } from "./types";

export type PermissionSet = {
  canCreateTask: boolean;
  canDeleteTask: (task: Task) => boolean;
  canEditTask: (task: Task) => boolean;
  canManageColumns: boolean;
  canManageEverything: boolean;
  canManageProjects: boolean;
  canMoveTask: (task: Task) => boolean;
  canViewOnly: boolean;
};

export function getPermissions(profile: Profile | null | undefined): PermissionSet {
  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";
  const isWorker = profile?.role === "worker";
  const currentUserId = profile?.id;

  return {
    canCreateTask: isManager || isWorker,
    canDeleteTask: () => isManager,
    canEditTask: (task) => isManager || (isWorker && isOwnTask(task, currentUserId)),
    canManageColumns: isManager,
    canManageEverything: isManager,
    canManageProjects: isAdmin,
    canMoveTask: (task) => isManager || (isWorker && isOwnTask(task, currentUserId)),
    canViewOnly: !isManager && !isWorker,
  };
}

function isOwnTask(task: Task, currentUserId: string | undefined) {
  return Boolean(currentUserId && task.assigneeId === currentUserId);
}
