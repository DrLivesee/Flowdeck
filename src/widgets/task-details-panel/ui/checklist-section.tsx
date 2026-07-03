import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ChecklistItemId, Task } from "@/entities/task";
import { Badge, Button, Input } from "@/shared/ui";

type ChecklistSectionProps = {
  isReadOnly?: boolean;
  newChecklistTitle: string;
  progress: { completed: number; ratio: number; total: number };
  task: Task;
  onAdd: () => void;
  onDelete: (checklistItemId: ChecklistItemId) => void;
  onRename: (checklistItemId: ChecklistItemId, title: string) => void;
  onTitleChange: (title: string) => void;
  onToggle: (checklistItemId: ChecklistItemId) => void;
};

export function ChecklistSection({
  isReadOnly = false,
  newChecklistTitle,
  progress,
  task,
  onAdd,
  onDelete,
  onRename,
  onTitleChange,
  onToggle,
}: ChecklistSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">{t("taskDetails.checklist.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {progress.total > 0
              ? t("taskDetails.checklist.progress", progress)
              : t("taskDetails.checklist.empty")}
          </p>
        </div>
        {progress.total > 0 && <Badge variant="cyan">{Math.round(progress.ratio * 100)}%</Badge>}
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={t("taskDetails.checklist.title")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress.ratio * 100)}
      >
        <div
          className="h-full rounded-full bg-cyan-300 transition-all"
          style={{ width: `${Math.round(progress.ratio * 100)}%` }}
        />
      </div>

      <div className="mt-4 space-y-2">
        {task.checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
            {isReadOnly ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-white/20" aria-hidden="true">
                {item.completed && <span className="size-2.5 rounded-sm bg-cyan-300" />}
              </span>
            ) : (
              <button
                className="flex size-5 shrink-0 items-center justify-center rounded-md border border-white/20 transition hover:border-cyan-300 hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                type="button"
                aria-label={
                  item.completed
                    ? t("taskDetails.checklist.markIncomplete", { item: item.title })
                    : t("taskDetails.checklist.markComplete", { item: item.title })
                }
                onClick={() => onToggle(item.id)}
              >
                {item.completed && <span className="size-2.5 rounded-sm bg-cyan-300" />}
              </button>
            )}

            {isReadOnly ? (
              <span className="min-w-0 flex-1 px-2 py-1 text-sm text-slate-300">{item.title}</span>
            ) : (
              <input
                className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                defaultValue={item.title}
                aria-label={t("taskDetails.checklist.rename", { item: item.title })}
                onBlur={(event) => onRename(item.id, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
            )}

            {!isReadOnly && (
              <button
                className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-300/10 hover:text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
                type="button"
                aria-label={t("taskDetails.checklist.delete", { item: item.title })}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={t("taskDetails.checklist.placeholder")}
            value={newChecklistTitle}
            placeholder={t("taskDetails.checklist.placeholder")}
            onChange={(event) => onTitleChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAdd();
              }
            }}
          />
          <Button className="shrink-0 gap-2" type="button" disabled={!newChecklistTitle.trim()} onClick={onAdd}>
            <Plus className="size-4" />
            {t("taskDetails.checklist.add")}
          </Button>
        </div>
      )}
    </section>
  );
}
