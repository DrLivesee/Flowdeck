import { describe, expect, it } from "vitest";

import { isAssignableProfile, selectAssignableProfiles, selectProjectMemberProfiles } from "./selectors";
import type { AppRole, Profile } from "./types";

function createProfile(role: AppRole, id = role): Profile {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    role,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("profile selectors", () => {
  const profiles = [
    createProfile("admin"),
    createProfile("manager"),
    createProfile("worker"),
    createProfile("guest"),
  ];

  it("selects non-admin profiles as project member candidates", () => {
    expect(selectProjectMemberProfiles(profiles).map((profile) => profile.role)).toEqual(["manager", "worker", "guest"]);
  });

  it("selects only manager and worker profiles as assignable users", () => {
    expect(selectAssignableProfiles(profiles).map((profile) => profile.role)).toEqual(["manager", "worker"]);
  });

  it("identifies assignable roles", () => {
    expect(profiles.map(isAssignableProfile)).toEqual([false, true, true, false]);
  });
});
