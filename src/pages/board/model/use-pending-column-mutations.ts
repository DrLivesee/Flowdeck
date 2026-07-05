import { useState } from "react";

export function usePendingColumnMutations() {
  const [pendingColumnIds, setPendingColumnIds] = useState<string[]>([]);

  async function runWithPendingColumns<T>(columnIds: Array<string | undefined>, mutation: () => Promise<T>) {
    setPendingColumnIds([...new Set(columnIds.filter(Boolean) as string[])]);

    try {
      return await mutation();
    } finally {
      setPendingColumnIds([]);
    }
  }

  function getDisplayedPendingColumnIds({
    fallbackColumnIds,
    isFallbackPending,
  }: {
    fallbackColumnIds: string[];
    isFallbackPending: boolean;
  }) {
    if (pendingColumnIds.length > 0) {
      return pendingColumnIds;
    }

    return isFallbackPending ? fallbackColumnIds : [];
  }

  return { getDisplayedPendingColumnIds, runWithPendingColumns };
}
