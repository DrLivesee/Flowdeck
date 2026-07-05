import { describe, expect, it } from "vitest";

import { insertProjectId } from "./project-order";

describe("insertProjectId", () => {
  it("moves a project id to a target index", () => {
    expect(insertProjectId(["one", "two", "three"], "three", 1)).toEqual(["one", "three", "two"]);
  });

  it("clamps the target index", () => {
    expect(insertProjectId(["one", "two", "three"], "one", 99)).toEqual(["two", "three", "one"]);
    expect(insertProjectId(["one", "two", "three"], "two", -1)).toEqual(["two", "one", "three"]);
  });

  it("adds unknown project ids at the target index for defensive callers", () => {
    expect(insertProjectId(["one", "two"], "three", 1)).toEqual(["one", "three", "two"]);
  });
});
