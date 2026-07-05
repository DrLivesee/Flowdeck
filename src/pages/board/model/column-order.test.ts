import { describe, expect, it } from "vitest";

import { createBoard } from "@/shared/testing/domain-factories";

import { applyOptimisticColumnOrder, insertId } from "./column-order";

describe("insertId", () => {
  it("moves an existing id to a safe target index", () => {
    expect(insertId(["one", "two", "three"], "three", 1)).toEqual(["one", "three", "two"]);
    expect(insertId(["one", "two", "three"], "one", 99)).toEqual(["two", "three", "one"]);
    expect(insertId(["one", "two", "three"], "two", -1)).toEqual(["two", "one", "three"]);
  });
});

describe("applyOptimisticColumnOrder", () => {
  it("applies matching optimistic order and keeps missing ids", () => {
    const board = createBoard({ id: "board", columnIds: ["todo", "doing", "done"] });

    expect(
      applyOptimisticColumnOrder(board, {
        boardId: "board",
        columnIds: ["done", "todo"],
      })?.columnIds,
    ).toEqual(["done", "todo", "doing"]);
  });

  it("ignores optimistic order for another board", () => {
    const board = createBoard({ id: "board", columnIds: ["todo", "done"] });

    expect(
      applyOptimisticColumnOrder(board, {
        boardId: "other",
        columnIds: ["done", "todo"],
      }),
    ).toBe(board);
  });
});
