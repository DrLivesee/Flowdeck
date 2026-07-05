import { describe, expect, it } from "vitest";

import { createBoard, createColumn, createTask } from "@/shared/testing/domain-factories";

import { buildAnalyticsView } from "./analytics-view";

describe("analytics view", () => {
  it("computes board metrics and recent tasks", () => {
    const board = createBoard({ columnIds: ["open", "done"] });
    const open = createColumn({ id: "open", final: false, taskIds: ["overdue", "today"] });
    const done = createColumn({ id: "done", final: true, taskIds: ["done"] });
    const overdue = createTask({
      id: "overdue",
      columnId: "open",
      priority: "urgent",
      deadline: "2026-06-17",
      updatedAt: "2026-06-17T08:00:00.000Z",
      checklist: [{ id: "check-1", title: "Check", completed: true, createdAt: "2026-06-17T00:00:00.000Z" }],
    });
    const today = createTask({
      id: "today",
      columnId: "open",
      priority: "low",
      updatedAt: "2026-06-18T09:00:00.000Z",
      checklist: [{ id: "check-2", title: "Check", completed: false, createdAt: "2026-06-18T00:00:00.000Z" }],
    });
    const doneTask = createTask({ id: "done", columnId: "done", updatedAt: "2026-06-18T10:00:00.000Z" });

    const analytics = buildAnalyticsView({
      activeBoard: board,
      columnsById: { open, done },
      tasksById: { overdue, today, done: doneTask },
      now: new Date("2026-06-18T12:00:00.000Z"),
    });

    expect(analytics.totalTasks).toBe(3);
    expect(analytics.completedTasks).toBe(1);
    expect(analytics.overdueTasks).toBe(1);
    expect(analytics.updatedToday).toBe(2);
    expect(analytics.checklistRatio).toBe(0.5);
    expect(analytics.priorityBreakdown.find((item) => item.priority === "urgent")?.count).toBe(1);
    expect(analytics.recentTasks.map((row) => row.task.id)).toEqual(["done", "today", "overdue"]);
  });
});
