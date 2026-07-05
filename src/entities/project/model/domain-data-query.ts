import { useQuery } from "@tanstack/react-query";

import {
  getBoardDataSnapshot,
  getDomainDataSnapshot,
  getTagsSnapshot,
  getWorkspaceSnapshot,
} from "../api/domain-data-api";

const workspaceStaleTime = 2 * 60 * 1000;
const boardDataStaleTime = 30 * 1000;
const tagsStaleTime = 5 * 60 * 1000;

export const domainDataQueryKeys = {
  all: ["domain-data"] as const,
  snapshot: ["domain-data", "snapshot"] as const,
  workspace: ["domain-data", "workspace"] as const,
  board: (boardId: string | null | undefined) => ["domain-data", "board", boardId] as const,
  boards: ["domain-data", "board"] as const,
  tags: ["domain-data", "tags"] as const,
};

export function useDomainDataQuery() {
  return useQuery({
    queryKey: domainDataQueryKeys.snapshot,
    queryFn: getDomainDataSnapshot,
  });
}

export function useWorkspaceQuery() {
  return useQuery({
    queryKey: domainDataQueryKeys.workspace,
    queryFn: getWorkspaceSnapshot,
    staleTime: workspaceStaleTime,
  });
}

export function useBoardDataQuery(boardId: string | null | undefined) {
  return useQuery({
    queryKey: domainDataQueryKeys.board(boardId),
    queryFn: () => getBoardDataSnapshot(boardId),
    enabled: Boolean(boardId),
    staleTime: boardDataStaleTime,
  });
}

export function useTagsQuery() {
  return useQuery({
    queryKey: domainDataQueryKeys.tags,
    queryFn: getTagsSnapshot,
    staleTime: tagsStaleTime,
  });
}
