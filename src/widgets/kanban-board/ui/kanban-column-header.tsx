import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ActionRail, Badge, IconButton, Input, Spinner } from "@/shared/ui";

type ColumnHeaderProps = {
  columnName: string;
  disableDelete: boolean;
  dragHandle: ReactNode;
  isActionsVisible: boolean;
  isEditingName: boolean;
  isFinal?: boolean;
  isPending?: boolean;
  isReadOnly?: boolean;
  taskCount: number;
  title: string;
  onCancelRename: () => void;
  onColumnDelete: () => void;
  onColumnNameChange: (name: string) => void;
  onSaveRename: () => void;
  onStartRename: () => void;
};

export function ColumnHeader({
  columnName,
  disableDelete,
  dragHandle,
  isActionsVisible,
  isEditingName,
  isPending = false,
  isReadOnly = false,
  taskCount,
  title,
  onCancelRename,
  onColumnDelete,
  onColumnNameChange,
  onSaveRename,
  onStartRename,
}: ColumnHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0">
      {isEditingName ? (
        <ColumnRenameForm
          columnName={columnName}
          title={title}
          onCancel={onCancelRename}
          onChange={onColumnNameChange}
          onSave={onSaveRename}
        />
      ) : (
        <div className="flex min-w-0 items-start gap-2">
          <span
            className="line-clamp-3 min-w-0 flex-1 break-words font-bold leading-5 text-white"
            title={title}
          >
            {title}
          </span>
          <Badge className="shrink-0 py-0.5" variant="slate">
            <span
              aria-label={t("board.columns.taskCount", { count: taskCount })}
            >
              {taskCount}
            </span>
          </Badge>
          {isPending && <Spinner className="size-4 text-cyan-200" />}
        </div>
      )}

      {!isEditingName && !isReadOnly && (
        <ActionRail mode="controlled" isVisible={isActionsVisible}>
          {dragHandle}
          <IconButton
            label={t("board.columns.manage.rename", { column: title })}
            onClick={onStartRename}
          >
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            label={t("board.columns.manage.delete", { column: title })}
            disabled={disableDelete}
            variant="danger"
            onClick={onColumnDelete}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </ActionRail>
      )}
    </div>
  );
}

function ColumnRenameForm({
  columnName,
  title,
  onCancel,
  onChange,
  onSave,
}: {
  columnName: string;
  title: string;
  onCancel: () => void;
  onChange: (name: string) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 rounded-xl px-3 text-sm"
        value={columnName}
        aria-label={t("board.columns.manage.renameAria", { column: title })}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }

          if (event.key === "Escape") {
            onCancel();
          }
        }}
      />
      <IconButton
        label={t("board.columns.manage.saveRename", { column: title })}
        disabled={!columnName.trim()}
        onClick={onSave}
      >
        <Check className="size-4" />
      </IconButton>
      <IconButton
        label={t("board.columns.manage.cancelRename", { column: title })}
        onClick={onCancel}
      >
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

export function ColumnDragHandle({
  label,
  attributes,
  listeners,
  setRef,
}: {
  label: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setRef: (element: HTMLElement | null) => void;
}) {
  return (
    <IconButton
      ref={setRef}
      label={label}
      variant="drag"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </IconButton>
  );
}

export function ColumnDeleteConfirm({
  taskCount,
  onCancel,
  onConfirm,
}: {
  taskCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3">
      <p className="text-xs leading-5 text-rose-100">
        {taskCount > 0
          ? t("board.columns.manage.deleteWithTasks", { count: taskCount })
          : t("board.columns.manage.deleteEmpty")}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          type="button"
          onClick={onCancel}
        >
          {t("board.columns.manage.keep")}
        </button>
        <button
          className="rounded-full bg-rose-300 px-3 py-1.5 text-xs font-bold text-rose-950 transition hover:bg-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
          type="button"
          onClick={onConfirm}
        >
          {t("board.columns.manage.confirmDelete")}
        </button>
      </div>
    </div>
  );
}
