import { supabase } from "@/shared/api";

import { selectAssignableProfiles } from "../model/selectors";
import type { Profile, ProfileRow } from "../model/types";

type ProjectMemberRow = {
  project_id: string;
  profile_id: string;
  sort_order: number;
};

export type UpdateOwnProfileInput = {
  birthDate?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
};

const profileColumns = "id,email,first_name,last_name,middle_name,full_name,birth_date,role,created_at,updated_at";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
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
    .select(profileColumns)
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
    .select(profileColumns)
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

export async function updateOwnProfile(input: UpdateOwnProfileInput) {
  const { error } = await supabase.rpc("update_own_profile", {
    p_birth_date: input.birthDate || null,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_middle_name: input.middleName || null,
  });

  if (error) {
    throw error;
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name ?? undefined,
    fullName: row.full_name,
    birthDate: row.birth_date ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
