import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import type { TaskId } from "@/entities/task";
import type { Profile } from "@/entities/profile";
import type { Tag } from "@/entities/tag";
import { resolveTaskDrop } from "@/features/move-task";

import {
  getKanbanColumnsById,
  getKanbanTasksById,
  getTaskDropTarget,
} from "../model/dnd";
import type { Task } from "@/entities/task";
import type { KanbanColumnView } from "../model/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanDragOverlay } from "./kanban-drag-overlay";

type KanbanBoardProps = {
  columns: KanbanColumnView[];
  isFiltered?: boolean;
  isReadOnly?: boolean;
  pendingColumnIds?: string[];
  canDeleteTask?: (task: Task) => boolean;
  canEditTask?: (task: Task) => boolean;
  canMoveTask?: (task: Task) => boolean;
  profilesById: Record<string, Profile>;
  tagsById: Record<string, Tag>;
  locale: string;
  onColumnDelete: (columnId: string) => void;
  onColumnRename: (columnId: string, name: string) => void;
  onColumnReorder: (columnId: string, targetIndex: number) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskOpen: (taskId: string) => void;
  onTaskMove: (taskId: string, targetColumnId: string, targetIndex: number) => void;
  onTaskReorder: (taskId: string, targetIndex: number) => void;
};

export function KanbanBoard({
  columns,
  canDeleteTask = () => false,
  canEditTask = () => false,
  canMoveTask = () => false,
  isFiltered = false,
  isReadOnly = false,
  pendingColumnIds = [],
  profilesById,
  tagsById,
  locale,
  onColumnDelete,
  onColumnRename,
  onColumnReorder,
  onTaskDelete,
  onTaskMove,
  onTaskOpen,
  onTaskReorder,
}: KanbanBoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<TaskId | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const columnsById = useMemo(() => getKanbanColumnsById(columns), [columns]);
  const tasksById = useMemo(() => getKanbanTasksById(columns), [columns]);
  const columnIds = useMemo(() => columns.map(({ column }) => column.id), [columns]);
  const activeTask = activeTaskId ? tasksById[activeTaskId] : undefined;
  const activeColumn = activeColumnId
    ? columns.find(({ column }) => column.id === activeColumnId)
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    const activeData = getTaskDropTarget(event.active.data.current);

    if (!activeData || (activeData.type === "column" && isReadOnly)) {
      return;
    }

    if (activeData.type === "task") {
      const activeTask = tasksById[activeData.taskId];

      if (!activeTask || !canMoveTask(activeTask)) {
        return;
      }
    }

    setActiveTaskId(activeData?.type === "task" ? activeData.taskId : null);
    setActiveColumnId(activeData?.type === "column" ? activeData.columnId : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    setActiveColumnId(null);

    const activeData = getTaskDropTarget(event.active.data.current);
    const overData = getTaskDropTarget(event.over?.data.current);

    if (!activeData || !overData) {
      return;
    }

    if (activeData.type === "column") {
      if (isReadOnly) {
        return;
      }

      const targetIndex = columns.findIndex(({ column }) => column.id === overData.columnId);

      if (targetIndex >= 0 && activeData.columnId !== overData.columnId) {
        onColumnReorder(activeData.columnId, targetIndex);
      }

      return;
    }

    const movableTask = tasksById[activeData.taskId];

    if (!movableTask || !canMoveTask(movableTask)) {
      return;
    }

    const dropResult = resolveTaskDrop({
      activeTaskId: activeData.taskId,
      activeColumnId: activeData.columnId,
      overTarget: overData,
      columnsById,
    });

    if (!dropResult) {
      return;
    }

    if (dropResult.type === "move") {
      onTaskMove(dropResult.taskId, dropResult.targetColumnId, dropResult.targetIndex);
      return;
    }

    onTaskReorder(dropResult.taskId, dropResult.targetIndex);
  }

  function clearActiveDrag() {
    setActiveTaskId(null);
    setActiveColumnId(null);
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragCancel={clearActiveDrag}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext
        items={columnIds}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flowdeck-kanban-grid grid gap-4 xl:grid-cols-5">
          {columns.map(({ column, tasks }) => (
            <KanbanColumn
              key={column.id}
              column={column}
              columnCount={columns.length}
              canDeleteTask={canDeleteTask}
              canEditTask={canEditTask}
              canMoveTask={canMoveTask}
              isFiltered={isFiltered}
              isPending={pendingColumnIds.includes(column.id)}
              isReadOnly={isReadOnly}
              locale={locale}
              onColumnDelete={onColumnDelete}
              onColumnRename={onColumnRename}
              onTaskDelete={onTaskDelete}
              onTaskOpen={onTaskOpen}
              profilesById={profilesById}
              tagsById={tagsById}
              tasks={tasks}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        <KanbanDragOverlay
          activeColumn={activeColumn}
          activeTask={activeTask}
          locale={locale}
          tagsById={tagsById}
        />
      </DragOverlay>
    </DndContext>
  );
}
