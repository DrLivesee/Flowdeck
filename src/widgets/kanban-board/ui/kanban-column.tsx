import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TaskDropTarget } from "@/features/move-task";
import type { Profile } from "@/entities/profile";
import type { Tag } from "@/entities/tag";
import type { Task } from "@/entities/task";
import { cn } from "@/shared/lib";
import { Card } from "@/shared/ui";

import { getTaskTags } from "../model/dnd";
import type { KanbanColumnView } from "../model/types";
import { columnAccentSurfaceClass } from "../model/view";
import {
  ColumnDeleteConfirm,
  ColumnDragHandle,
  ColumnHeader,
} from "./kanban-column-header";
import { SortableTaskCard } from "./sortable-task-card";

type KanbanColumnProps = KanbanColumnView & {
  columnCount: number;
  isFiltered: boolean;
  isPending?: boolean;
  isReadOnly?: boolean;
  locale: string;
  canDeleteTask: (task: Task) => boolean;
  canEditTask: (task: Task) => boolean;
  canMoveTask: (task: Task) => boolean;
  onColumnDelete: (columnId: string) => void;
  onColumnRename: (columnId: string, name: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskOpen: (taskId: string) => void;
  profilesById: Record<string, Profile>;
  tagsById: Record<string, Tag>;
};

export function KanbanColumn({
  column,
  tasks,
  tagsById,
  isFiltered,
  isPending = false,
  isReadOnly = false,
  locale,
  canDeleteTask,
  canEditTask,
  canMoveTask,
  columnCount,
  onColumnDelete,
  onColumnRename,
  onTaskDelete,
  onTaskOpen,
  profilesById,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isColumnHovered, setIsColumnHovered] = useState(false);
  const [isTaskHovered, setIsTaskHovered] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const isActionsVisible = isColumnHovered && !isTaskHovered;
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const {
    attributes,
    isDragging,
    isOver,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    } satisfies TaskDropTarget,
  });
  const { isOver: isTaskListOver, setNodeRef: setTaskListNodeRef } =
    useDroppable({
      id: `task-list-${column.id}`,
      data: {
        type: "column",
        columnId: column.id,
      } satisfies TaskDropTarget,
    });

  function startEditingName() {
    setColumnName(column.name);
    setIsEditingName(true);
    setIsConfirmingDelete(false);
  }

  function saveColumnName() {
    const nextName = columnName.trim();

    if (nextName) {
      onColumnRename(column.id, nextName);
      setIsEditingName(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Card
        className={cn(
          "flowdeck-kanban-column group/columnCard relative min-h-96 overflow-visible p-4 transition",
          columnAccentSurfaceClass[column.accent],
          isOver && "border-cyan-300/40",
          isDragging && "opacity-40",
        )}
        onPointerEnter={() => setIsColumnHovered(true)}
        onPointerLeave={() => {
          setIsColumnHovered(false);
          setIsTaskHovered(false);
        }}
      >
        <div className="flowdeck-column-controls mb-4 space-y-3">
          <ColumnHeader
            columnName={columnName}
            isActionsVisible={isActionsVisible}
            isEditingName={isEditingName}
            isFinal={column.final}
            isPending={isPending}
            isReadOnly={isReadOnly}
            taskCount={tasks.length}
            title={column.name}
            dragHandle={
              isReadOnly ? null : (
                <ColumnDragHandle
                  attributes={attributes}
                  label={t("board.columns.manage.drag", { column: column.name })}
                  listeners={listeners}
                  setRef={setActivatorNodeRef}
                />
              )
            }
            onCancelRename={() => setIsEditingName(false)}
            onColumnDelete={() => {
              setIsConfirmingDelete(true);
              setIsEditingName(false);
            }}
            onColumnNameChange={setColumnName}
            onSaveRename={saveColumnName}
            onStartRename={startEditingName}
            disableDelete={columnCount <= 1}
          />

          {isConfirmingDelete && (
            <ColumnDeleteConfirm
              taskCount={tasks.length}
              onCancel={() => setIsConfirmingDelete(false)}
              onConfirm={() => {
                onColumnDelete(column.id);
                setIsConfirmingDelete(false);
              }}
            />
          )}
        </div>

        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setTaskListNodeRef}
            className={cn(
              "flowdeck-task-list min-h-28 space-y-3 rounded-3xl transition",
              isTaskListOver && "bg-cyan-300/5 ring-1 ring-cyan-300/20",
            )}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                assigneeName={task.assigneeId ? profilesById[task.assigneeId]?.fullName : undefined}
                canDelete={canDeleteTask(task)}
                canEdit={canEditTask(task)}
                canMove={canMoveTask(task)}
                locale={locale}
              isReadOnly={false}
                onTaskDelete={onTaskDelete}
                onTaskHoverChange={setIsTaskHovered}
                onTaskOpen={onTaskOpen}
                tags={getTaskTags(task, tagsById)}
                task={task}
              />
            ))}

            {tasks.length === 0 && (
              <div className="flowdeck-empty-column rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                {isFiltered
                  ? t("board.filters.emptyColumn")
                  : column.final
                    ? t("board.emptyFinalColumn")
                  : t("board.emptyColumn")}
              </div>
            )}
          </div>
        </SortableContext>
        {isPending && (
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-slate-950/20" aria-hidden="true" />
        )}
      </Card>
    </div>
  );
}
