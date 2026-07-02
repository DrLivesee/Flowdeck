import type { Profile } from "./types";

export function indexProfilesById(profiles: Profile[]) {
  return Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
}

export function selectProjectMemberProfiles(profiles: Profile[]) {
  return profiles.filter((profile) => profile.role !== "admin");
}

export function selectAssignableProfiles(profiles: Profile[]) {
  return profiles.filter(isAssignableProfile);
}

export function isAssignableProfile(profile: Profile) {
  return profile.role === "manager" || profile.role === "worker";
}
