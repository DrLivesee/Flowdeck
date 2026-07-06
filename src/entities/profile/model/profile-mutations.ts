import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateOwnProfile } from "../api/profile-api";
import { profileQueryKeys } from "./profile-queries";

export function useUpdateOwnProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOwnProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKeys.all }),
  });
}
