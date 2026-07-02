import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  moveTask,
  reorderTask,
  updateTask,
} from "../api/task-mutations-api";
import { domainDataQueryKeys } from "./domain-data-query";

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const invalidateBoard = (boardId: string) => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.board(boardId), exact: true });
  const invalidateSnapshot = () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.snapshot, exact: true });
  const invalidateWorkspace = () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.workspace, exact: true });
  const invalidateBoardAndWorkspace = (boardId: string) => Promise.all([invalidateBoard(boardId), invalidateWorkspace(), invalidateSnapshot()]);
  const invalidateBoardAndSnapshot = (boardId: string) => Promise.all([invalidateBoard(boardId), invalidateSnapshot()]);

  return {
    createTask: useMutation({ mutationFn: createTask, onSuccess: (_data, input) => invalidateBoardAndWorkspace(input.boardId) }),
    deleteTask: useMutation({ mutationFn: deleteTask, onSuccess: (_data, input) => invalidateBoardAndWorkspace(input.boardId) }),
    moveTask: useMutation({ mutationFn: moveTask, onSuccess: (_data, input) => invalidateBoardAndWorkspace(input.boardId) }),
    reorderTask: useMutation({ mutationFn: reorderTask, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
    updateTask: useMutation({ mutationFn: updateTask, onSuccess: (_data, input) => invalidateBoardAndSnapshot(input.boardId) }),
  };
}
