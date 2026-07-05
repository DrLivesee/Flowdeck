import { useMutation } from "@tanstack/react-query";

import { deleteCurrentAccount } from "../api/delete-account-api";

export function useDeleteAccountMutation() {
  return useMutation({ mutationFn: deleteCurrentAccount });
}
