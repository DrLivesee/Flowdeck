import { describe, expect, it } from "vitest";

import { createBoard, createColumn, createTask } from "@/shared/testing/domain-factories";

import { buildBoardColumns, getBoardStats } from "./board-view";

describe("board view", () => {
  it("builds ordered board columns and skips missing entities", () => {
    const board = createBoard({ columnIds: ["todo", "missing", "done"] });
    const todo = createColumn({ id: "todo", taskIds: ["task-1", "missing-task"] });
    const done = createColumn({ id: "done", final: true, taskIds: ["task-2"] });
    const task1 = createTask({ id: "task-1", columnId: "todo" });
    const task2 = createTask({ id: "task-2", columnId: "done" });

    expect(
      buildBoardColumns({
        activeBoard: board,
        columnsById: { todo, done },
        tasksById: { "task-1": task1, "task-2": task2 },
      }),
    ).toEqual([
      { column: todo, tasks: [task1] },
      { column: done, tasks: [task2] },
    ]);
  });

  it("calculates completion ratio using final columns and completedAt", () => {
    const todo = createColumn({ id: "todo", final: false });
    const done = createColumn({ id: "done", final: true });
    const stats = getBoardStats([
      { column: todo, tasks: [createTask({ id: "open" }), createTask({ id: "closed", completedAt: "2026-01-02T00:00:00.000Z" })] },
      { column: done, tasks: [createTask({ id: "final", columnId: "done" })] },
    ]);

    expect(stats).toEqual({ totalColumns: 2, totalTasks: 3, completionRatio: 2 / 3 });
  });
});
