import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  archiveProject,
  createBoardWithDefaultColumns,
  createColumn,
  createProjectWithMembers,
  createProjectWithDefaultBoard,
  createTag,
  deleteBoard,
  deleteColumn,
  deleteProject,
  deleteTag,
  renameBoard,
  renameColumn,
  renameProject,
  renameTag,
  reorderBoards,
  reorderColumns,
  reorderProjectMemberships,
  reorderProjects,
  updateProjectMembers,
} from "../api/structure-mutations-api";
import { domainDataQueryKeys } from "./domain-data-query";

export function useProjectStructureMutations() {
  const queryClient = useQueryClient();
  const invalidateWorkspace = () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.workspace, exact: true });
  const invalidateBoard = (boardId: string) => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.board(boardId), exact: true });
  const invalidateBoards = () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.boards });
  const invalidateTags = () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.tags, exact: true });
  const invalidateWorkspaceAndBoards = () => Promise.all([invalidateWorkspace(), invalidateBoards()]);
  const invalidateBoardAndWorkspace = (boardId: string) => Promise.all([invalidateBoard(boardId), invalidateWorkspace()]);

  return {
    archiveProject: useMutation({ mutationFn: archiveProject, onSuccess: invalidateWorkspace }),
    createBoard: useMutation({ mutationFn: createBoardWithDefaultColumns, onSuccess: invalidateWorkspaceAndBoards }),
    createColumn: useMutation({ mutationFn: createColumn, onSuccess: (_data, input) => invalidateBoard(input.boardId) }),
    createProject: useMutation({ mutationFn: createProjectWithDefaultBoard, onSuccess: invalidateWorkspaceAndBoards }),
    createProjectWithMembers: useMutation({ mutationFn: createProjectWithMembers, onSuccess: invalidateWorkspaceAndBoards }),
    createTag: useMutation({ mutationFn: createTag, onSuccess: invalidateTags }),
    deleteBoard: useMutation({ mutationFn: deleteBoard, onSuccess: invalidateWorkspaceAndBoards }),
    deleteColumn: useMutation({ mutationFn: deleteColumn, onSuccess: (_data, input) => invalidateBoardAndWorkspace(input.boardId) }),
    deleteProject: useMutation({ mutationFn: deleteProject, onSuccess: invalidateWorkspaceAndBoards }),
    deleteTag: useMutation({ mutationFn: deleteTag, onSuccess: invalidateTags }),
    renameBoard: useMutation({ mutationFn: renameBoard, onSuccess: invalidateWorkspace }),
    renameColumn: useMutation({ mutationFn: renameColumn, onSuccess: (_data, input) => invalidateBoard(input.boardId) }),
    renameProject: useMutation({ mutationFn: renameProject, onSuccess: invalidateWorkspace }),
    renameTag: useMutation({ mutationFn: renameTag, onSuccess: invalidateTags }),
    reorderBoards: useMutation({ mutationFn: reorderBoards, onSuccess: invalidateWorkspace }),
    reorderColumns: useMutation({ mutationFn: reorderColumns, onSuccess: (_data, input) => invalidateBoardAndWorkspace(input.boardId) }),
    reorderProjectMemberships: useMutation({ mutationFn: reorderProjectMemberships, onSuccess: invalidateWorkspace }),
    reorderProjects: useMutation({ mutationFn: reorderProjects, onSuccess: invalidateWorkspace }),
    updateProjectMembers: useMutation({ mutationFn: updateProjectMembers, onSuccess: invalidateWorkspace }),
  };
}
