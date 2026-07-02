import { CalendarDays, CheckCircle2, MessageSquare, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Tag, TagColor } from "@/entities/tag";
import { selectChecklistProgress, type Task, type TaskPriority } from "@/entities/task";
import { cn, formatDate } from "@/shared/lib";
import { Badge, OverflowTooltip } from "@/shared/ui";

const priorityVariant: Record<TaskPriority, "cyan" | "violet" | "amber" | "rose"> = {
  low: "cyan",
  medium: "violet",
  high: "amber",
  urgent: "rose",
};

const tagVariant: Record<TagColor, "cyan" | "emerald" | "violet" | "amber" | "rose" | "slate"> = {
  cyan: "cyan",
  emerald: "emerald",
  violet: "violet",
  amber: "amber",
  rose: "rose",
  slate: "slate",
};

type TaskCardProps = {
  task: Task;
  tags: Tag[];
  locale: string;
  assigneeName?: string;
};

export function TaskCard({ task, tags, locale, assigneeName }: TaskCardProps) {
  const { t } = useTranslation();
  const checklistProgress = selectChecklistProgress(task);

  return (
    <article
      className={cn(
        "flowdeck-task-card w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-left shadow-2xl shadow-black/20 transition hover:border-cyan-300/30 hover:bg-slate-900/90",
      )}
    >
      <div className="flowdeck-task-card-header mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-3 min-w-0 max-w-full flex-1 break-words font-semibold leading-6 text-white" title={task.title}>
          {task.title}
        </h3>
        <Badge variant={priorityVariant[task.priority]}>
          {t(`taskPriority.${task.priority}`)}
        </Badge>
      </div>

      {task.description && (
        <OverflowTooltip
          text={task.description}
          className="flowdeck-task-card-description mb-4 block"
          contentClassName="line-clamp-2 whitespace-normal text-sm leading-6 text-slate-500"
        />
      )}

      {tags.length > 0 && (
        <div className="flowdeck-task-card-tags mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} className="max-w-full" variant={tagVariant[tag.color]}>
              <OverflowTooltip text={tag.name} contentClassName="max-w-24" />
            </Badge>
          ))}
        </div>
      )}

      <div className="flowdeck-task-card-meta flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {task.deadline ? formatDate(task.deadline, locale) : t("board.noDeadline")}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" />
          <span className="truncate">{assigneeName ?? t("taskAssignee.unassigned")}</span>
        </span>
        <span className="flowdeck-task-card-meta-group inline-flex items-center gap-3">
          {checklistProgress.total > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              {t("board.checklistProgress", checklistProgress)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {t("board.commentsCount", { count: task.commentIds.length })}
          </span>
        </span>
      </div>
    </article>
  );
}
