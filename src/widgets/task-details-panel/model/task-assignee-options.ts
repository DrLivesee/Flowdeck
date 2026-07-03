import type { Profile } from "@/entities/profile";

export function getTaskAssigneeName(taskAssigneeId: string | undefined, profilesById: Record<string, Profile>) {
  const profile = taskAssigneeId ? profilesById[taskAssigneeId] : undefined;

  return profile?.fullName || profile?.email;
}
