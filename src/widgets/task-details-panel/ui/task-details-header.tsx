import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Task } from "@/entities/task";
import { formatDate } from "@/shared/lib";

type TaskDetailsHeaderProps = {
  task: Task;
  locale: string;
  assigneeName?: string;
  descriptionId?: string;
  titleId?: string;
  onClose: () => void;
};

export function TaskDetailsHeader({ task, locale, assigneeName, descriptionId, titleId, onClose }: TaskDetailsHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="border-b border-white/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
            {t("taskDetails.eyebrow")}
          </p>
          <h2 id={titleId} className="mt-2 text-3xl font-black tracking-tight text-white">{task.title}</h2>
          <div id={descriptionId} className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
            <span>{t("taskDetails.updatedAt", { date: formatDate(task.updatedAt, locale) })}</span>
            {task.completedAt && (
              <span>{t("taskDetails.completedAt", { date: formatDate(task.completedAt, locale) })}</span>
            )}
            <span>{t("taskDetails.assignee", { assignee: assigneeName ?? t("taskAssignee.unassigned") })}</span>
          </div>
        </div>
        <button
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          type="button"
          aria-label={t("taskDetails.close")}
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>
    </header>
  );
}
