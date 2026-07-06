export type AppRole = "admin" | "guest" | "manager" | "worker";

export type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  birthDate?: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  full_name: string;
  birth_date: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
};
