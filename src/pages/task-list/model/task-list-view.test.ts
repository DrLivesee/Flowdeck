import { describe, expect, it } from "vitest";

import type { Project } from "@/entities/project";
import { createBoard, createColumn, createTask } from "@/shared/testing/domain-factories";

import { buildAllTaskListColumns, getFilteredTaskRows, normalizeTaskListSort, paginateTaskRows, sortTaskRows, sortTaskRowsByProject } from "./task-list-view";

describe("task list view", () => {
  it("normalizes invalid sort values", () => {
    expect(normalizeTaskListSort("priority")).toBe("priority");
    expect(normalizeTaskListSort("unknown")).toBe("updated");
    expect(normalizeTaskListSort(null)).toBe("updated");
  });

  it("sorts rows by priority and deadline", () => {
    const column = createColumn();
    const low = createTask({ id: "low", priority: "low", deadline: "2026-06-20" });
    const urgent = createTask({ id: "urgent", priority: "urgent", deadline: "2026-06-19" });
    const rows = [low, urgent].map((task) => ({ column, task }));

    expect(sortTaskRows(rows, "priority").map((row) => row.task.id)).toEqual(["urgent", "low"]);
    expect(sortTaskRows(rows, "deadline").map((row) => row.task.id)).toEqual(["urgent", "low"]);
  });

  it("sorts rows inside each project group", () => {
    const column = createColumn();
    const firstProject = createProject({ id: "project-1" });
    const secondProject = createProject({ id: "project-2" });
    const rows = [
      { column, project: firstProject, task: createTask({ id: "p1-low", priority: "low" }) },
      { column, project: firstProject, task: createTask({ id: "p1-urgent", priority: "urgent" }) },
      { column, project: secondProject, task: createTask({ id: "p2-low", priority: "low" }) },
      { column, project: secondProject, task: createTask({ id: "p2-urgent", priority: "urgent" }) },
    ];

    expect(sortTaskRowsByProject(rows, "priority").map((row) => row.task.id)).toEqual([
      "p1-urgent",
      "p1-low",
      "p2-urgent",
      "p2-low",
    ]);
  });

  it("filters then flattens task columns", () => {
    const column = createColumn({ taskIds: ["api", "ui"] });
    const api = createTask({ id: "api", title: "API task", priority: "high" });
    const ui = createTask({ id: "ui", title: "UI task", priority: "low" });

    expect(
      getFilteredTaskRows({
        columns: [{ column, tasks: [api, ui] }],
        filters: { search: "api", priority: "all", tagId: "all", deadline: "all", completion: "all" },
        sort: "updated",
      }).map((row) => row.task.id),
    ).toEqual(["api"]);
  });

  it("builds user-scoped task columns from every project", () => {
    const project = createProject({ boardIds: ["board-1", "board-2"] });
    const firstBoard = { ...createBoard({ id: "board-1", columnIds: ["column-1"] }) };
    const secondBoard = { ...createBoard({ id: "board-2", columnIds: ["column-2"] }) };
    const firstColumn = createColumn({ id: "column-1", boardId: "board-1", taskIds: ["own", "other"] });
    const secondColumn = createColumn({ id: "column-2", boardId: "board-2", taskIds: ["also-own"] });
    const columns = buildAllTaskListColumns({
      boardsById: { [firstBoard.id]: firstBoard, [secondBoard.id]: secondBoard },
      columnsById: { [firstColumn.id]: firstColumn, [secondColumn.id]: secondColumn },
      currentUserId: "user-1",
      isAdmin: false,
      projectIds: [project.id],
      projectsById: { [project.id]: project },
      tasksById: {
        "also-own": createTask({ id: "also-own", assigneeId: "user-1", columnId: "column-2", boardId: "board-2" }),
        other: createTask({ id: "other", assigneeId: "user-2", columnId: "column-1", boardId: "board-1" }),
        own: createTask({ id: "own", assigneeId: "user-1", columnId: "column-1", boardId: "board-1" }),
      },
    });

    expect(columns.flatMap((column) => column.tasks.map((task) => task.id))).toEqual(["own", "also-own"]);
  });

  it("keeps every task for admin scope", () => {
    const project = createProject({ boardIds: ["board-1"] });
    const board = createBoard({ id: "board-1", columnIds: ["column-1"] });
    const column = createColumn({ id: "column-1", boardId: "board-1", taskIds: ["assigned", "unassigned"] });
    const columns = buildAllTaskListColumns({
      boardsById: { [board.id]: board },
      columnsById: { [column.id]: column },
      currentUserId: "admin-user",
      isAdmin: true,
      projectIds: [project.id],
      projectsById: { [project.id]: project },
      tasksById: {
        assigned: createTask({ id: "assigned", assigneeId: "user-1" }),
        unassigned: createTask({ id: "unassigned", assigneeId: undefined }),
      },
    });

    expect(columns.flatMap((item) => item.tasks.map((task) => task.id))).toEqual(["assigned", "unassigned"]);
  });

  it("paginates task rows by twenty items", () => {
    const column = createColumn();
    const rows = Array.from({ length: 45 }, (_, index) => ({ column, task: createTask({ id: `task-${index}` }) }));

    expect(paginateTaskRows(rows, 1).rows).toHaveLength(20);
    expect(paginateTaskRows(rows, 3).rows.map((row) => row.task.id)).toEqual(["task-40", "task-41", "task-42", "task-43", "task-44"]);
    expect(paginateTaskRows(rows, 99).currentPage).toBe(3);
  });
});

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Project",
    boardIds: ["board-1"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
