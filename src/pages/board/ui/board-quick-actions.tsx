import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BoardId } from "@/entities/board";
import type { Column } from "@/entities/column";
import { CreateColumnForm } from "@/features/create-column";

type BoardQuickActionsProps = {
  boardId: BoardId;
  canCreateColumn?: boolean;
  canCreateTask?: boolean;
  columnCreateDisabledReason?: string;
  isCreateColumnPending?: boolean;
  isTaskCreationDisabled?: boolean;
  taskCreateDisabledReason?: string;
  onCreateColumn: (input: { accent: Column["accent"]; boardId: BoardId; name: string }) => Promise<void> | void;
  onCreateTask: () => void;
};

export function BoardQuickActions({ boardId, canCreateColumn = false, canCreateTask = false, columnCreateDisabledReason, isCreateColumnPending = false, isTaskCreationDisabled = false, taskCreateDisabledReason, onCreateColumn, onCreateTask }: BoardQuickActionsProps) {
  const { t } = useTranslation();
  const isNewTaskDisabled = isTaskCreationDisabled || Boolean(taskCreateDisabledReason);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        {canCreateColumn && <CreateColumnForm boardId={boardId} disabledReason={columnCreateDisabledReason} isPending={isCreateColumnPending} onCreateColumn={onCreateColumn} />}
        {canCreateTask && (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-300 shadow-lg shadow-black/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isNewTaskDisabled}
            title={taskCreateDisabledReason}
            onClick={onCreateTask}
          >
            <Plus className="size-4" />
            {t("app.newTask")}
          </button>
        )}
      </div>
      {(columnCreateDisabledReason || taskCreateDisabledReason) && (
        <div className="space-y-1 text-right text-xs leading-5 text-amber-200/90">
          {columnCreateDisabledReason && <p>{columnCreateDisabledReason}</p>}
          {taskCreateDisabledReason && <p>{taskCreateDisabledReason}</p>}
        </div>
      )}
    </div>
  );
}
