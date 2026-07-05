import { describe, expect, it } from "vitest";

import { resolveTaskDrop, type TaskDropColumn } from "./resolve-task-drop";

const columnsById: Record<string, TaskDropColumn> = {
  todo: { id: "todo", taskIds: ["task-1", "task-2"] },
  done: { id: "done", taskIds: [] },
  review: { id: "review", taskIds: ["task-3"] },
};

describe("resolveTaskDrop", () => {
  it("returns null when dropping on the same position", () => {
    expect(
      resolveTaskDrop({
        activeTaskId: "task-1",
        activeColumnId: "todo",
        overTarget: { type: "task", taskId: "task-1", columnId: "todo" },
        columnsById,
      }),
    ).toBeNull();
  });

  it("resolves reorder inside the same column", () => {
    expect(
      resolveTaskDrop({
        activeTaskId: "task-1",
        activeColumnId: "todo",
        overTarget: { type: "task", taskId: "task-2", columnId: "todo" },
        columnsById,
      }),
    ).toEqual({ type: "reorder", taskId: "task-1", targetIndex: 1 });
  });

  it("resolves move to an empty column", () => {
    expect(
      resolveTaskDrop({
        activeTaskId: "task-1",
        activeColumnId: "todo",
        overTarget: { type: "column", columnId: "done" },
        columnsById,
      }),
    ).toEqual({ type: "move", taskId: "task-1", targetColumnId: "done", targetIndex: 0 });
  });

  it("resolves move before a target task in another column", () => {
    expect(
      resolveTaskDrop({
        activeTaskId: "task-1",
        activeColumnId: "todo",
        overTarget: { type: "task", taskId: "task-3", columnId: "review" },
        columnsById,
      }),
    ).toEqual({ type: "move", taskId: "task-1", targetColumnId: "review", targetIndex: 0 });
  });
});
