import { supabase } from "@/shared/api";

import { selectAssignableProfiles } from "../model/selectors";
import type { Profile, ProfileRow } from "../model/types";

type ProjectMemberRow = {
  project_id: string;
  profile_id: string;
  sort_order: number;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data) : null;
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,updated_at")
    .order("full_name")
    .returns<ProfileRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProfile);
}

export async function getProjectMembers(projectId: string): Promise<Profile[]> {
  const { data: memberRows, error: memberError } = await supabase
    .from("project_members")
    .select("project_id,profile_id,sort_order")
    .eq("project_id", projectId)
    .order("sort_order")
    .returns<ProjectMemberRow[]>();

  if (memberError) {
    throw memberError;
  }

  const memberIds = memberRows?.map((member) => member.profile_id) ?? [];

  if (memberIds.length === 0) {
    return [];
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,updated_at")
    .in("id", memberIds)
    .returns<ProfileRow[]>();

  if (profileError) {
    throw profileError;
  }

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, mapProfile(profile)]));

  return memberIds
    .map((memberId) => profilesById.get(memberId))
    .filter((profile): profile is Profile => Boolean(profile));
}

export async function getAssignableProfiles(projectId: string): Promise<Profile[]> {
  const projectMembers = await getProjectMembers(projectId);

  return selectAssignableProfiles(projectMembers);
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
