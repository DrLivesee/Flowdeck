import { supabase } from "@/shared/api";

export async function deleteCurrentAccount() {
  const response = await supabase.functions.invoke<void>("delete-self", {
    method: "POST",
  });

  if (response.error) {
    throw response.error;
  }
}
