import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { withBoardColumns } from "@/entities/board";
import { emptyBoardDataSnapshot, emptyWorkspaceSnapshot, useBoardDataQuery, useProjectStructureMutations, useTagsQuery, useTaskMutations, useTaskSecondaryMutations, useWorkspaceQuery } from "@/entities/project";
import { getPermissions, indexProfilesById, RoleCapabilityHint, useAssignableProfilesQuery, useProfilesQuery, type AppRole } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { selectTags } from "@/entities/tag";
import { CreateTaskForm } from "@/features/create-task";
import {
  countTasksInColumns,
  filterTaskColumns,
  hasActiveTaskFilters,
} from "@/features/filter-tasks";
import { appLimits } from "@/shared/config";
import { getAppLimitErrorMessage, getStoredBoardId } from "@/shared/lib";
import { Card, InlineAlert } from "@/shared/ui";
import { KanbanBoard } from "@/widgets/kanban-board";
import { TaskDetailsPanel } from "@/widgets/task-details-panel";

import { getRouteBoard } from "../model/board-route";
import { buildBoardColumns, getBoardStats } from "../model/board-view";
import { applyOptimisticColumnOrder, insertId, type OptimisticColumnOrder } from "../model/column-order";
import { useBoardSearchParams } from "../model/use-board-search-params";
import { usePendingColumnMutations } from "../model/use-pending-column-mutations";
import { BoardFilters } from "./board-filters";
import { BoardQuickActions } from "./board-quick-actions";
import { BoardTabs } from "./board-tabs";
import { BoardTitleActions } from "./board-title-actions";

export function BoardPage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { boardId, projectId } = useParams();
  const { user } = useAuth();
  const {
    clearFilters,
    closeCreateTask,
    closeTaskDetails,
    isCreatingTask,
    openCreateTask,
    openTaskDetails,
    selectedTaskId,
    taskFilters,
    updateFilterParam,
  } = useBoardSearchParams();
  const { data: workspaceData, isError: isWorkspaceError, isLoading: isWorkspaceLoading } = useWorkspaceQuery();
  const { data: profiles = [] } = useProfilesQuery();
  const mutations = useProjectStructureMutations();
  const taskMutations = useTaskMutations();
  const secondaryMutations = useTaskSecondaryMutations();
  const { getDisplayedPendingColumnIds, runWithPendingColumns } = usePendingColumnMutations();
  const [isColumnOrderPending, setIsColumnOrderPending] = useState(false);
  const [optimisticColumnOrder, setOptimisticColumnOrder] = useState<OptimisticColumnOrder | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const workspace = workspaceData ?? emptyWorkspaceSnapshot;
  const projectsById = workspace.projectsById;
  const boardsById = workspace.boardsById;
  const fallbackBoardId = getStoredBoardId(boardsById) ?? workspace.activeBoardId;
  const activeBoard = getRouteBoard({ activeBoardId: fallbackBoardId, boardId, boardsById, projectId });
  const { data: assignableProfiles = [] } = useAssignableProfilesQuery(activeBoard?.projectId);
  const { data: boardData, isError: isBoardDataError, isLoading: isBoardDataLoading } = useBoardDataQuery(activeBoard?.id);
  const { data: tagsById = {}, isError: isTagsError, isLoading: isTagsLoading } = useTagsQuery();
  const boardSnapshot = boardData ?? emptyBoardDataSnapshot;
  const columnsById = boardSnapshot.columnsById;
  const tasksById = boardSnapshot.tasksById;
  const commentsById = boardSnapshot.commentsById;
  const activityById = boardSnapshot.activityById;
  const locale = i18n.language === "en" ? "en-US" : "ru-RU";
  const selectedTask = selectedTaskId ? tasksById[selectedTaskId] : undefined;
  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);
  const currentProfile = user ? profilesById[user.id] : null;
  const permissions = useMemo(() => getPermissions(currentProfile), [currentProfile]);
  const isBoardReadOnly = !permissions.canManageEverything;
  const isBoardMutationPending = mutations.deleteBoard.isPending || mutations.renameBoard.isPending || mutations.reorderBoards.isPending;
  const isColumnMutationPending = mutations.createColumn.isPending || mutations.deleteColumn.isPending || mutations.renameColumn.isPending || mutations.reorderColumns.isPending || isColumnOrderPending;
  const isTaskMutationPending = taskMutations.createTask.isPending || taskMutations.deleteTask.isPending || taskMutations.moveTask.isPending || taskMutations.reorderTask.isPending || taskMutations.updateTask.isPending;
  const isKanbanBusy = isColumnMutationPending || isTaskMutationPending;
  const activeBoardView = useMemo(
    () => withBoardColumns(activeBoard, columnsById),
    [activeBoard, columnsById],
  );
  const orderedActiveBoardView = useMemo(
    () => applyOptimisticColumnOrder(activeBoardView, optimisticColumnOrder),
    [activeBoardView, optimisticColumnOrder],
  );
  const hasFilters = hasActiveTaskFilters(taskFilters);
  const deferredSearch = useDeferredValue(taskFilters.search);
  const deferredTaskFilters = useMemo(
    () => ({
      completion: taskFilters.completion,
      deadline: taskFilters.deadline,
      priority: taskFilters.priority,
      search: deferredSearch,
      tagId: taskFilters.tagId,
    }),
    [deferredSearch, taskFilters.completion, taskFilters.deadline, taskFilters.priority, taskFilters.tagId],
  );
  const tags = useMemo(() => selectTags(tagsById), [tagsById]);
  const boardColumns = useMemo(
    () => buildBoardColumns({ activeBoard: orderedActiveBoardView, columnsById, tasksById }),
    [orderedActiveBoardView, columnsById, tasksById],
  );
  const filteredBoardColumns = useMemo(
    () => filterTaskColumns(boardColumns, deferredTaskFilters),
    [boardColumns, deferredTaskFilters],
  );
  const columnsForForms = useMemo(() => boardColumns.map((item) => item.column), [boardColumns]);
  const filteredTaskCount = useMemo(
    () => countTasksInColumns(filteredBoardColumns),
    [filteredBoardColumns],
  );
  const boardStats = useMemo(() => getBoardStats(boardColumns), [boardColumns]);
  const hasInvalidRouteParams = Boolean(
    projectId && boardId && (!projectsById[projectId] || boardsById[boardId]?.projectId !== projectId),
  );
  const projectBoards = useMemo(() => {
    if (!activeBoard) return [];
    const project = projectsById[activeBoard.projectId];

    return project?.boardIds.flatMap((id) => boardsById[id] ?? []) ?? [];
  }, [activeBoard, boardsById, projectsById]);
  const boardCreateDisabledReason = projectBoards.length >= appLimits.boardsPerProject
    ? t("limits.boardsPerProject", { limit: appLimits.boardsPerProject })
    : undefined;
  const columnCreateDisabledReason = boardColumns.length >= appLimits.columnsPerBoard
    ? t("limits.columnsPerBoard", { limit: appLimits.columnsPerBoard })
    : undefined;
  const taskCreateDisabledReason = boardStats.totalTasks >= appLimits.tasksPerBoard
    ? t("limits.tasksPerBoard", { limit: appLimits.tasksPerBoard })
    : undefined;

  function navigateToBoard(nextProjectId?: string | null, nextBoardId?: string | null) {
    void navigate(nextProjectId && nextBoardId ? `/projects/${nextProjectId}/boards/${nextBoardId}` : "/board");
  }

  async function runBoardAction(action: () => Promise<unknown>) {
    setMutationError(null);

    try {
      await action();
    } catch (error) {
      setMutationError(getAppLimitErrorMessage(error, t) ?? t("common.mutationError"));
    }
  }

  async function reorderColumn(columnId: string, targetIndex: number) {
    if (!activeBoardView) {
      return;
    }

    const nextColumnIds = insertId(activeBoardView.columnIds, columnId, targetIndex);
    setMutationError(null);
    setOptimisticColumnOrder({ boardId: activeBoardView.id, columnIds: nextColumnIds });
    setIsColumnOrderPending(true);

    try {
      await mutations.reorderColumns.mutateAsync({ boardId: activeBoardView.id, columnId, targetIndex });
      setOptimisticColumnOrder(null);
    } catch (error) {
      setOptimisticColumnOrder(null);
      setMutationError(getAppLimitErrorMessage(error, t) ?? t("common.mutationError"));
    } finally {
      setIsColumnOrderPending(false);
    }
  }

  if (isWorkspaceLoading || (activeBoard && isBoardDataLoading) || isTagsLoading) {
    return <BoardStateMessage description={t("common.loading")} />;
  }

  if (isWorkspaceError || isBoardDataError || isTagsError) {
    return <BoardStateMessage description={t("common.serverError")} />;
  }

  if (hasInvalidRouteParams || !activeBoard) {
    return (
      <BoardStateMessage
        description={hasInvalidRouteParams ? t("board.invalidRoute") : t(getNoActiveBoardMessageKey(currentProfile?.role, permissions))}
      />
    );
  }

  return (
    <section className="space-y-6">
      {currentProfile && <RoleCapabilityHint role={currentProfile.role} />}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <BoardTabs
              activeBoardId={activeBoard.id}
              activeBoardActions={
                !isBoardReadOnly && !isBoardMutationPending ? (
                  <BoardTitleActions
                    activeBoard={activeBoard}
                    canDelete={projectBoards.length > 1}
                    onBoardDelete={() => {
                      void runBoardAction(async () => {
                        await mutations.deleteBoard.mutateAsync(activeBoard.id);
                        navigateToBoard(activeBoard.projectId, null);
                      });
                    }}
                    onBoardRename={(name) => {
                      void runBoardAction(() => mutations.renameBoard.mutateAsync({ boardId: activeBoard.id, name }));
                    }}
                  />
                ) : null
              }
              boards={projectBoards}
              createDisabledReason={boardCreateDisabledReason}
              isCreatePending={mutations.createBoard.isPending}
              isReadOnly={isBoardReadOnly || isBoardMutationPending}
              onBoardCreate={(name) => {
                void runBoardAction(async () => {
                  const result = await mutations.createBoard.mutateAsync({ projectId: activeBoard.projectId, name, defaultColumnNames: getDefaultColumnNames(t) });
                  navigateToBoard(result.projectId, result.boardId);
                });
              }}
              onBoardReorder={(nextBoardId, targetIndex) => {
                void runBoardAction(() => mutations.reorderBoards.mutateAsync({ boards: projectBoards, boardId: nextBoardId, targetIndex }));
              }}
              onBoardSelect={(nextBoardId) => {
                navigateToBoard(activeBoard.projectId, nextBoardId);
              }}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {(permissions.canManageColumns || permissions.canCreateTask) && (
            <BoardQuickActions
              boardId={activeBoard.id}
              canCreateColumn={permissions.canManageColumns}
              canCreateTask={permissions.canCreateTask}
              columnCreateDisabledReason={columnCreateDisabledReason}
              isCreateColumnPending={mutations.createColumn.isPending}
              isTaskCreationDisabled={isKanbanBusy}
              taskCreateDisabledReason={taskCreateDisabledReason}
              onCreateColumn={(input) => mutations.createColumn.mutateAsync(input)}
              onCreateTask={openCreateTask}
            />
          )}
        </div>
      </div>

      {mutationError && <BoardMutationError message={mutationError} onDismiss={() => setMutationError(null)} />}

      <BoardFilters
        filters={taskFilters}
        hasFilters={hasFilters}
        tags={tags}
        totalTaskCount={boardStats.totalTasks}
        visibleTaskCount={filteredTaskCount}
        onClear={clearFilters}
        onFilterChange={updateFilterParam}
      />

      {hasFilters && filteredTaskCount === 0 && boardStats.totalTasks > 0 && (
        <Card className="border-cyan-300/20 bg-cyan-300/5 p-5">
          <p className="font-bold text-white">{t("board.filters.emptyTitle")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t("board.filters.emptyDescription")}
          </p>
        </Card>
      )}

      <KanbanBoard
        columns={filteredBoardColumns}
        canDeleteTask={(task) => !isKanbanBusy && permissions.canDeleteTask(task)}
        canEditTask={(task) => !isKanbanBusy && permissions.canEditTask(task)}
        canMoveTask={(task) => !isKanbanBusy && permissions.canMoveTask(task)}
        isFiltered={hasFilters}
        isReadOnly={isBoardReadOnly || isKanbanBusy}
        locale={locale}
        onColumnDelete={(columnId) => {
          void runBoardAction(() => mutations.deleteColumn.mutateAsync({ boardId: activeBoard.id, columnId }));
        }}
        onColumnRename={(columnId, name) => {
          void runBoardAction(() => mutations.renameColumn.mutateAsync({ boardId: activeBoard.id, columnId, name }));
        }}
        onColumnReorder={(columnId, targetIndex) => {
          void reorderColumn(columnId, targetIndex);
        }}
        onTaskDelete={(taskId) => {
          void runBoardAction(() => runWithPendingColumns([tasksById[taskId]?.columnId], () => taskMutations.deleteTask.mutateAsync({ boardId: activeBoard.id, taskId })));
        }}
        onTaskMove={(taskId, targetColumnId, targetIndex) => {
          void runBoardAction(() => runWithPendingColumns([tasksById[taskId]?.columnId, targetColumnId], () => taskMutations.moveTask.mutateAsync({ boardId: activeBoard.id, taskId, targetColumnId, targetIndex })));
        }}
        onTaskOpen={openTaskDetails}
        onTaskReorder={(taskId, targetIndex) => {
          const task = tasksById[taskId];

          if (task) {
            void runBoardAction(() => runWithPendingColumns([task.columnId], () => taskMutations.reorderTask.mutateAsync({ boardId: activeBoard.id, taskId, columnId: task.columnId, targetIndex })));
          }
        }}
        pendingColumnIds={getDisplayedPendingColumnIds({ fallbackColumnIds: columnsForForms.map((column) => column.id), isFallbackPending: isColumnMutationPending })}
        profilesById={profilesById}
        tagsById={tagsById}
      />

      {isCreatingTask && permissions.canCreateTask && !taskCreateDisabledReason && (
        <CreateTaskForm
          boardId={activeBoard.id}
          canChooseAssignee={permissions.canManageEverything}
          columns={columnsForForms}
          currentUserId={currentProfile?.id}
          onClose={closeCreateTask}
          onCreateTask={(input) => runWithPendingColumns([input.columnId], () => taskMutations.createTask.mutateAsync(input))}
          profiles={assignableProfiles}
          tags={tags}
        />
      )}

      {selectedTask && (
        <TaskDetailsPanel
          activityById={activityById}
          commentsById={commentsById}
          canDelete={permissions.canDeleteTask(selectedTask)}
          canChooseAssignee={permissions.canManageEverything}
          assigneeProfiles={assignableProfiles}
          columns={columnsForForms}
          locale={locale}
          isReadOnly={!permissions.canEditTask(selectedTask)}
          onClose={closeTaskDetails}
          onAddChecklistItem={(input) => secondaryMutations.addChecklistItem.mutateAsync(input)}
          onAddTaskComment={(input) => secondaryMutations.addTaskComment.mutateAsync(input)}
          onDeleteChecklistItem={(input) => secondaryMutations.deleteChecklistItem.mutateAsync(input)}
          onDeleteTask={(taskId) => runWithPendingColumns([selectedTask.columnId], () => taskMutations.deleteTask.mutateAsync({ boardId: activeBoard.id, taskId }))}
          onDeleteTaskComment={(input) => secondaryMutations.deleteTaskComment.mutateAsync(input)}
          onEditTaskComment={(input) => secondaryMutations.editTaskComment.mutateAsync(input)}
          onRenameChecklistItem={(input) => secondaryMutations.renameChecklistItem.mutateAsync(input)}
          onToggleChecklistItem={(input) => secondaryMutations.toggleChecklistItem.mutateAsync(input)}
          onUpdateTask={(input) => runWithPendingColumns([selectedTask.columnId, input.targetColumnId], () => taskMutations.updateTask.mutateAsync({ ...input, boardId: activeBoard.id }))}
          profilesById={profilesById}
          tags={tags}
          task={selectedTask}
        />
      )}
    </section>
  );

}

function getDefaultColumnNames(t: (key: string) => string) {
  return ["backlog", "inProgress", "review", "done"].map((key) => t(`projectDefaults.columns.${key}`));
}

function BoardStateMessage({ description }: { description: string }) {
  return (
    <section className="space-y-6">
      <Card className="border-dashed border-white/10 p-8 text-center">
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </Card>
    </section>
  );
}

function getNoActiveBoardMessageKey(role: AppRole | undefined, permissions: ReturnType<typeof getPermissions>) {
  if (role === "admin") {
    return "board.noActiveBoardAdmin";
  }

  return permissions.canManageEverything ? "board.noActiveBoard" : "board.noActiveBoardReadOnly";
}

function BoardMutationError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const { t } = useTranslation();

  return (
    <InlineAlert className="flex items-start justify-between gap-3">
      <span>{message}</span>
      <button className="shrink-0 text-xs font-bold text-rose-100 underline-offset-4 hover:underline" type="button" onClick={onDismiss}>
        {t("common.dismiss")}
      </button>
    </InlineAlert>
  );
}
