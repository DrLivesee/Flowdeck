import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { TaskCard } from "@/entities/task";
import type { Task } from "@/entities/task";
import type { Tag } from "@/entities/tag";
import type { TaskDropTarget } from "@/features/move-task";
import { cn } from "@/shared/lib";
import { ActionRail, IconButton } from "@/shared/ui";

type SortableTaskCardProps = {
  task: Task;
  tags: Tag[];
  locale: string;
  assigneeName?: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canMove?: boolean;
  isReadOnly?: boolean;
  onTaskDelete: (taskId: string) => void;
  onTaskHoverChange?: (isHovered: boolean) => void;
  onTaskOpen: (taskId: string) => void;
};

export function SortableTaskCard({
  task,
  tags,
  locale,
  assigneeName,
  canDelete = false,
  canEdit = false,
  canMove = false,
  isReadOnly = false,
  onTaskDelete,
  onTaskHoverChange,
  onTaskOpen,
}: SortableTaskCardProps) {
  const { t } = useTranslation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
      columnId: task.columnId,
    } satisfies TaskDropTarget,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("group/taskCard relative", isDragging && "opacity-40")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onPointerEnter={() => onTaskHoverChange?.(true)}
      onPointerLeave={() => onTaskHoverChange?.(false)}
    >
      {!isReadOnly && (
      <ActionRail>
        {canMove && (
          <IconButton
            ref={setActivatorNodeRef}
            label={t("board.dragTask", { task: task.title })}
            variant="drag"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </IconButton>
        )}
        {canEdit && (
          <IconButton
            label={t("board.editTask", { task: task.title })}
            onClick={() => onTaskOpen(task.id)}
          >
            <Pencil className="size-4" />
          </IconButton>
        )}
        {!canEdit && (
          <IconButton
            label={t("taskDetails.openTask", { task: task.title })}
            onClick={() => onTaskOpen(task.id)}
          >
            <Eye className="size-4" />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            label={t("board.deleteTask.action", { task: task.title })}
            variant="danger"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2 className="size-4" />
          </IconButton>
        )}
      </ActionRail>
      )}

      {canDelete && isConfirmingDelete && (
        <QuickDeletePopover
          onCancel={() => setIsConfirmingDelete(false)}
          onConfirm={() => onTaskDelete(task.id)}
        />
      )}

      <TaskCard assigneeName={assigneeName} locale={locale} tags={tags} task={task} />
    </div>
  );
}

function QuickDeletePopover({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="absolute right-0 top-8 z-20 w-64 rounded-2xl border border-rose-300/20 bg-slate-950 p-3 shadow-2xl shadow-black/50">
      <p className="text-sm font-bold text-white">{t("board.deleteTask.title")}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        {t("board.deleteTask.description")}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
        >
          {t("board.deleteTask.keep")}
        </button>
        <button
          className="rounded-full bg-rose-300 px-3 py-1.5 text-xs font-bold text-rose-950 transition hover:bg-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm();
          }}
        >
          {t("board.deleteTask.confirm")}
        </button>
      </div>
    </div>
  );
}
