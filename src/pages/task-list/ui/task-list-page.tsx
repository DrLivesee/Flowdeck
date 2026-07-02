import { useDeferredValue, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { emptyDomainDataSnapshot, useDomainDataQuery, useTaskMutations, useTaskSecondaryMutations } from "@/entities/project";
import { getPermissions, indexProfilesById, RoleCapabilityHint, useAssignableProfilesQuery, useProfilesQuery } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { selectTags } from "@/entities/tag";
import {
  deleteTaskFilterSearchParams,
  getTaskFiltersFromSearchParams,
  hasActiveTaskFilters,
} from "@/features/filter-tasks";
import { Card } from "@/shared/ui";
import { TaskDetailsPanel } from "@/widgets/task-details-panel";

import {
  buildAllTaskListColumns,
  getFilteredTaskRows,
  normalizeTaskListSort,
  normalizeTaskListPage,
  paginateTaskRows,
  type TaskListSortValue,
} from "../model/task-list-view";
import { TaskListFilters } from "./task-list-filters";
import { TaskListTable } from "./task-list-table";

const taskListSearchParams = {
  page: "page",
  sort: "sort",
} as const;

export function TaskListPage() {
  const { i18n, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: domainData, isError: isDomainError, isLoading: isDomainLoading } = useDomainDataQuery();
  const { data: profiles = [], isLoading: isProfilesLoading } = useProfilesQuery();
  const taskMutations = useTaskMutations();
  const secondaryMutations = useTaskSecondaryMutations();
  const domain = domainData ?? emptyDomainDataSnapshot;
  const { activityById, boardsById, columnsById, commentsById, projectIds, projectsById, tagsById, tasksById } = domain;
  const locale = i18n.language === "en" ? "en-US" : "ru-RU";
  const selectedTaskId = searchParams.get("task");
  const selectedTask = selectedTaskId ? tasksById[selectedTaskId] : undefined;
  const selectedBoard = selectedTask ? boardsById[selectedTask.boardId] : undefined;
  const { data: assignableProfiles = [] } = useAssignableProfilesQuery(selectedBoard?.projectId);
  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);
  const currentProfile = user ? profilesById[user.id] : null;
  const permissions = useMemo(() => getPermissions(currentProfile), [currentProfile]);
  const isAdmin = currentProfile?.role === "admin";
  const filters = useMemo(() => getTaskFiltersFromSearchParams(searchParams), [searchParams]);
  const deferredSearch = useDeferredValue(filters.search);
  const deferredFilters = useMemo(
    () => ({
      completion: filters.completion,
      deadline: filters.deadline,
      priority: filters.priority,
      search: deferredSearch,
      tagId: filters.tagId,
    }),
    [deferredSearch, filters.completion, filters.deadline, filters.priority, filters.tagId],
  );
  const sort = normalizeTaskListSort(searchParams.get(taskListSearchParams.sort));
  const requestedPage = normalizeTaskListPage(searchParams.get(taskListSearchParams.page));
  const hasFilters = hasActiveTaskFilters(filters);
  const tags = useMemo(() => selectTags(tagsById), [tagsById]);
  const taskColumns = useMemo(
    () => buildAllTaskListColumns({ boardsById, columnsById, currentUserId: user?.id, isAdmin, projectIds, projectsById, tasksById }),
    [boardsById, columnsById, isAdmin, projectIds, projectsById, tasksById, user?.id],
  );
  const rows = useMemo(
    () => getFilteredTaskRows({ columns: taskColumns, filters: deferredFilters, sort }),
    [deferredFilters, sort, taskColumns],
  );
  const { currentPage, rows: paginatedRows, totalPages } = useMemo(
    () => paginateTaskRows(rows, requestedPage),
    [requestedPage, rows],
  );
  const columnsForDetails = useMemo(
    () => selectedBoard?.columnIds.flatMap((columnId) => columnsById[columnId] ?? []) ?? [],
    [columnsById, selectedBoard?.columnIds],
  );
  const totalTaskCount = useMemo(
    () => taskColumns.reduce((total, column) => total + column.tasks.length, 0),
    [taskColumns],
  );

  function openTaskDetails(taskId: string) {
    updateSearchParams((nextSearchParams) => nextSearchParams.set("task", taskId));
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
      nextSearchParams.delete(taskListSearchParams.page);
    }, { replace: true });
  }

  function updateSort(sortValue: TaskListSortValue) {
    updateSearchParams((nextSearchParams) => {
      if (sortValue === "updated") {
        nextSearchParams.delete(taskListSearchParams.sort);
      } else {
        nextSearchParams.set(taskListSearchParams.sort, sortValue);
      }
      nextSearchParams.delete(taskListSearchParams.page);
    }, { replace: true });
  }

  function updatePage(page: number) {
    updateSearchParams((nextSearchParams) => {
      if (page <= 1) {
        nextSearchParams.delete(taskListSearchParams.page);
      } else {
        nextSearchParams.set(taskListSearchParams.page, String(page));
      }
    }, { replace: true });
  }

  function clearFilters() {
    updateSearchParams((nextSearchParams) => {
      deleteTaskFilterSearchParams(nextSearchParams);
      nextSearchParams.delete(taskListSearchParams.sort);
      nextSearchParams.delete(taskListSearchParams.page);
    }, { replace: true });
  }

  function updateSearchParams(update: (nextSearchParams: URLSearchParams) => void, options?: { replace?: boolean }) {
    const nextSearchParams = new URLSearchParams(searchParams);
    update(nextSearchParams);
    setSearchParams(nextSearchParams, options);
  }

  if (isDomainLoading || isProfilesLoading) {
    return (
      <section className="space-y-6">
        <StateMessage description={t("common.loading")} />
      </section>
    );
  }

  if (isDomainError) {
    return (
      <section className="space-y-6">
        <StateMessage description={t("common.serverError")} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {currentProfile && <RoleCapabilityHint role={currentProfile.role} />}

      <TaskListFilters
        filters={filters}
        hasFilters={hasFilters}
        sort={sort}
        tags={tags}
        onClear={clearFilters}
        onFilterChange={updateFilterParam}
        onSortChange={updateSort}
      />

      <TaskListTable
        currentPage={currentPage}
        hasFilters={hasFilters}
        locale={locale}
        profilesById={profilesById}
        rows={paginatedRows}
        tagsById={tagsById}
        totalTaskCount={totalTaskCount}
        totalFilteredCount={rows.length}
        totalPages={totalPages}
        onTaskOpen={openTaskDetails}
        onPageChange={updatePage}
      />

      {selectedTask && selectedBoard && (
        <TaskDetailsPanel
          activityById={activityById}
          commentsById={commentsById}
          canDelete={permissions.canDeleteTask(selectedTask)}
          canChooseAssignee={permissions.canManageEverything}
          assigneeProfiles={assignableProfiles}
          columns={columnsForDetails}
          isReadOnly={!permissions.canEditTask(selectedTask)}
          locale={locale}
          onClose={closeTaskDetails}
          onAddChecklistItem={(input) => secondaryMutations.addChecklistItem.mutateAsync(input)}
          onAddTaskComment={(input) => secondaryMutations.addTaskComment.mutateAsync(input)}
          onDeleteChecklistItem={(input) => secondaryMutations.deleteChecklistItem.mutateAsync(input)}
          onDeleteTask={(taskId) => taskMutations.deleteTask.mutateAsync({ boardId: selectedBoard.id, taskId })}
          onDeleteTaskComment={(input) => secondaryMutations.deleteTaskComment.mutateAsync(input)}
          onEditTaskComment={(input) => secondaryMutations.editTaskComment.mutateAsync(input)}
          onRenameChecklistItem={(input) => secondaryMutations.renameChecklistItem.mutateAsync(input)}
          onToggleChecklistItem={(input) => secondaryMutations.toggleChecklistItem.mutateAsync(input)}
          onUpdateTask={(input) => taskMutations.updateTask.mutateAsync({ ...input, boardId: selectedBoard.id })}
          profilesById={profilesById}
          tags={tags}
          task={selectedTask}
        />
      )}
    </section>
  );
}

function StateMessage({ description }: { description: string }) {
  return (
    <Card className="border-dashed border-white/10 p-8 text-center">
      <p className="text-sm leading-6 text-slate-500">{description}</p>
    </Card>
  );
}
