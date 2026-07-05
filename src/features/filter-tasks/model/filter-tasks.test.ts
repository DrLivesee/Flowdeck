import { describe, expect, it } from "vitest";

import { createColumn, createTask } from "@/shared/testing/domain-factories";

import {
  countTasksInColumns,
  filterTaskColumns,
  getTaskFiltersFromSearchParams,
  hasActiveTaskFilters,
  type TaskFilters,
} from "./filter-tasks";

const baseFilters: TaskFilters = {
  search: "",
  priority: "all",
  tagId: "all",
  deadline: "all",
  completion: "all",
};

describe("task filters", () => {
  it("normalizes URL search params", () => {
    const params = new URLSearchParams("q=api&priority=urgent&tag=tag-1&due=today&done=open");

    expect(getTaskFiltersFromSearchParams(params)).toEqual({
      search: "api",
      priority: "urgent",
      tagId: "tag-1",
      deadline: "today",
      completion: "open",
    });
  });

  it("detects active filters", () => {
    expect(hasActiveTaskFilters(baseFilters)).toBe(false);
    expect(hasActiveTaskFilters({ ...baseFilters, tagId: "tag-1" })).toBe(true);
  });

  it("filters by search, tag, priority, deadline, and completion", () => {
    const openColumn = createColumn({ id: "open", final: false });
    const doneColumn = createColumn({ id: "done", final: true });
    const apiTask = createTask({
      id: "api",
      title: "Build API",
      description: "Supabase integration",
      priority: "urgent",
      tagIds: ["backend"],
      deadline: "2026-06-18",
    });
    const completedTask = createTask({
      id: "done",
      title: "Done task",
      columnId: "done",
      completedAt: "2026-06-17T12:00:00.000Z",
    });

    const result = filterTaskColumns(
      [
        { column: openColumn, tasks: [apiTask] },
        { column: doneColumn, tasks: [completedTask] },
      ],
      {
        search: "api",
        priority: "urgent",
        tagId: "backend",
        deadline: "today",
        completion: "open",
      },
      new Date("2026-06-18T10:00:00.000Z"),
    );

    expect(countTasksInColumns(result)).toBe(1);
    expect(result[0].tasks).toEqual([apiTask]);
    expect(result[1].tasks).toEqual([]);
  });
});
