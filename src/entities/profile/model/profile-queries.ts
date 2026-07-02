import { useQuery } from "@tanstack/react-query";

import { getAssignableProfiles, getProfile, getProfiles, getProjectMembers } from "../api/profile-api";

const profileStaleTime = 5 * 60 * 1000;

export const profileQueryKeys = {
  current: (userId: string | undefined) => ["profile", "current", userId] as const,
  assignableByProject: (projectId: string | null | undefined) => ["profile", "assignable", projectId] as const,
  list: ["profile", "list"] as const,
  projectMembers: (projectId: string | null | undefined) => ["profile", "project-members", projectId] as const,
};

export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.current(userId),
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
    staleTime: profileStaleTime,
  });
}

export function useProfilesQuery() {
  return useQuery({
    queryKey: profileQueryKeys.list,
    queryFn: getProfiles,
    staleTime: profileStaleTime,
  });
}

export function useProjectMembersQuery(projectId: string | null | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.projectMembers(projectId),
    queryFn: () => getProjectMembers(projectId!),
    enabled: Boolean(projectId),
    staleTime: profileStaleTime,
  });
}

export function useAssignableProfilesQuery(projectId: string | null | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.assignableByProject(projectId),
    queryFn: () => getAssignableProfiles(projectId!),
    enabled: Boolean(projectId),
    staleTime: profileStaleTime,
  });
}
