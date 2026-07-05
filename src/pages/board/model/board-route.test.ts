import { describe, expect, it } from "vitest";

import { createBoard } from "@/shared/testing/domain-factories";

import { getRouteBoard } from "./board-route";

const boardsById = {
  first: createBoard({ id: "first", projectId: "project-a" }),
  second: createBoard({ id: "second", projectId: "project-b" }),
};

describe("getRouteBoard", () => {
  it("returns a board when route project and board match", () => {
    expect(
      getRouteBoard({
        activeBoardId: "second",
        boardId: "first",
        boardsById,
        projectId: "project-a",
      }),
    ).toBe(boardsById.first);
  });

  it("falls back to active board when route is invalid", () => {
    expect(
      getRouteBoard({
        activeBoardId: "second",
        boardId: "first",
        boardsById,
        projectId: "project-b",
      }),
    ).toBe(boardsById.second);
  });

  it("returns null when no route or fallback board is available", () => {
    expect(getRouteBoard({ boardsById })).toBeNull();
  });
});
