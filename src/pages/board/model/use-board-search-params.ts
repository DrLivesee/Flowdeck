import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  deleteTaskFilterSearchParams,
  getTaskFiltersFromSearchParams,
} from "@/features/filter-tasks";

export function useBoardSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get("task");
  const isCreatingTask = searchParams.get("createTask") === "true";
  const taskFilters = useMemo(
    () => getTaskFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  function updateSearchParams(update: (nextSearchParams: URLSearchParams) => void, options?: { replace?: boolean }) {
    const nextSearchParams = new URLSearchParams(searchParams);
    update(nextSearchParams);
    setSearchParams(nextSearchParams, options);
  }

  function openTaskDetails(taskId: string) {
    updateSearchParams((nextSearchParams) => {
      nextSearchParams.delete("createTask");
      nextSearchParams.set("task", taskId);
    });
  }

  function openCreateTask() {
    updateSearchParams((nextSearchParams) => {
      nextSearchParams.delete("task");
      nextSearchParams.set("createTask", "true");
    });
  }

  function closeCreateTask() {
    updateSearchParams((nextSearchParams) => nextSearchParams.delete("createTask"));
  }

  function closeTaskDetails() {
    updateSearchParams((nextSearchParams) => nextSearchParams.delete("task"));
  }

  function updateFilterParam(key: string, value: string, emptyValue = "all") {
    updateSearchParams((nextSearchParams) => {
      if (!value || value === emptyValue) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, value);
      }
    }, { replace: true });
  }

  function clearFilters() {
    updateSearchParams((nextSearchParams) => {
      deleteTaskFilterSearchParams(nextSearchParams);
    }, { replace: true });
  }

  return {
    clearFilters,
    closeCreateTask,
    closeTaskDetails,
    isCreatingTask,
    openCreateTask,
    openTaskDetails,
    selectedTaskId,
    taskFilters,
    updateFilterParam,
  };
}
