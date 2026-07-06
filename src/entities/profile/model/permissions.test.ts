import { describe, expect, it } from "vitest";

import { createTask } from "@/shared/testing/domain-factories";

import { getPermissions } from "./permissions";
import type { AppRole, Profile } from "./types";

function createProfile(role: AppRole, id = `${role}-user`): Profile {
  return {
    id,
    email: `${id}@example.com`,
    firstName: id,
    lastName: "User",
    fullName: id,
    role,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("getPermissions", () => {
  it("gives admin project management only", () => {
    const permissions = getPermissions(createProfile("admin"));
    const task = createTask({ assigneeId: "admin-user" });

    expect(permissions.canManageProjects).toBe(true);
    expect(permissions.canManageEverything).toBe(false);
    expect(permissions.canManageColumns).toBe(false);
    expect(permissions.canCreateTask).toBe(false);
    expect(permissions.canEditTask(task)).toBe(false);
    expect(permissions.canMoveTask(task)).toBe(false);
    expect(permissions.canDeleteTask(task)).toBe(false);
  });

  it("keeps manager content access without project management", () => {
    const permissions = getPermissions(createProfile("manager"));

    expect(permissions.canManageProjects).toBe(false);
    expect(permissions.canManageEverything).toBe(true);
    expect(permissions.canManageColumns).toBe(true);
    expect(permissions.canCreateTask).toBe(true);
    expect(permissions.canEditTask(createTask())).toBe(true);
    expect(permissions.canMoveTask(createTask())).toBe(true);
    expect(permissions.canDeleteTask(createTask())).toBe(true);
  });

  it("limits workers to assigned tasks", () => {
    const permissions = getPermissions(createProfile("worker", "worker-1"));
    const ownTask = createTask({ assigneeId: "worker-1" });
    const anotherTask = createTask({ assigneeId: "worker-2" });

    expect(permissions.canManageProjects).toBe(false);
    expect(permissions.canManageEverything).toBe(false);
    expect(permissions.canCreateTask).toBe(true);
    expect(permissions.canEditTask(ownTask)).toBe(true);
    expect(permissions.canMoveTask(ownTask)).toBe(true);
    expect(permissions.canEditTask(anotherTask)).toBe(false);
    expect(permissions.canMoveTask(anotherTask)).toBe(false);
  });

  it("keeps guests read-only", () => {
    const permissions = getPermissions(createProfile("guest"));
    const task = createTask({ assigneeId: "guest-user" });

    expect(permissions.canManageProjects).toBe(false);
    expect(permissions.canManageEverything).toBe(false);
    expect(permissions.canCreateTask).toBe(false);
    expect(permissions.canEditTask(task)).toBe(false);
    expect(permissions.canMoveTask(task)).toBe(false);
    expect(permissions.canDeleteTask(task)).toBe(false);
  });
});
