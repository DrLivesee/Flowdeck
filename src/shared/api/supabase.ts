import { createClient } from "@supabase/supabase-js";

const supabaseUrl = getViteEnvValue("VITE_SUPABASE_URL");
const supabaseAnonKey = getViteEnvValue("VITE_SUPABASE_ANON_KEY");

function getViteEnvValue(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY") {
  const value: unknown = import.meta.env[name];

  return typeof value === "string" ? value : undefined;
}

function requireSupabaseEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local before using Supabase.`);
  }

  return value;
}

export const supabase = createClient(
  requireSupabaseEnv(supabaseUrl, "VITE_SUPABASE_URL"),
  requireSupabaseEnv(supabaseAnonKey, "VITE_SUPABASE_ANON_KEY"),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
