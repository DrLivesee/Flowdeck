import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addChecklistItem,
  addTaskComment,
  deleteChecklistItem,
  deleteTaskComment,
  editTaskComment,
  renameChecklistItem,
  toggleChecklistItem,
} from "../api/task-secondary-mutations-api";
import { domainDataQueryKeys } from "./domain-data-query";

export function useTaskSecondaryMutations() {
  const queryClient = useQueryClient();
  const invalidateBoardData = (boardId: string) => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.board(boardId), exact: true });
  const invalidateBoardAndSnapshot = (boardId: string) => Promise.all([
    invalidateBoardData(boardId),
    queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.snapshot, exact: true }),
  ]);

  return {
    addChecklistItem: useMutation({ mutationFn: addChecklistItem, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    addTaskComment: useMutation({ mutationFn: addTaskComment, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    deleteChecklistItem: useMutation({ mutationFn: deleteChecklistItem, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    deleteTaskComment: useMutation({ mutationFn: deleteTaskComment, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    editTaskComment: useMutation({ mutationFn: editTaskComment, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    renameChecklistItem: useMutation({ mutationFn: renameChecklistItem, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    toggleChecklistItem: useMutation({ mutationFn: toggleChecklistItem, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
  };
}
