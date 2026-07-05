export type AppRole = "admin" | "guest" | "manager" | "worker";

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
};
