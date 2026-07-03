import { ArrowUpRight, CalendarDays, CheckCircle2, MessageSquare, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Profile } from "@/entities/profile";
import type { Tag, TagColor } from "@/entities/tag";
import type { TaskPriority } from "@/entities/task";
import { formatDate } from "@/shared/lib";
import { Badge, Button, Card } from "@/shared/ui";

import type { TaskListRow } from "../model/task-list-view";

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

type TaskListTableProps = {
  currentPage: number;
  hasFilters: boolean;
  locale: string;
  profilesById: Record<string, Profile>;
  rows: TaskListRow[];
  tagsById: Record<string, Tag>;
  totalFilteredCount: number;
  totalTaskCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onTaskOpen: (taskId: string) => void;
};

export function TaskListTable({ currentPage, hasFilters, locale, profilesById, rows, tagsById, totalFilteredCount, totalTaskCount, totalPages, onPageChange, onTaskOpen }: TaskListTableProps) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    const emptyState = totalTaskCount === 0
      ? { title: t("taskList.empty.noTasksTitle"), description: t("taskList.empty.noTasksDescription") }
      : hasFilters
        ? { title: t("taskList.empty.noResultsTitle"), description: t("taskList.empty.noResultsDescription") }
        : { title: t("taskList.empty.title"), description: t("taskList.empty.description") };

    return (
      <Card className="border-dashed border-white/10 p-8 text-center">
        <p className="font-bold text-white">{emptyState.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyState.description}</p>
      </Card>
    );
  }

  const groups = groupRowsByProject(rows);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.projectId} className="overflow-hidden">
          <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">{t("taskList.projectGroup")}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">{group.projectName}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("taskList.groupSummary", { boards: group.boardCount, tasks: group.rows.length })}</p>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-[1.4fr_1fr_0.75fr_0.75fr_0.9fr_auto] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 lg:grid">
            <span>{t("taskList.columns.task")}</span>
            <span>{t("taskList.columns.location")}</span>
            <span>{t("taskList.columns.priority")}</span>
            <span>{t("taskList.columns.deadline")}</span>
            <span>{t("taskList.columns.assignee")}</span>
            <span className="text-right">{t("taskList.columns.meta")}</span>
          </div>

          <div className="divide-y divide-white/10">
            {group.rows.map((row) => (
              <TaskListRowItem
                key={row.task.id}
                locale={locale}
                profilesById={profilesById}
                row={row}
                tags={row.task.tagIds.flatMap((tagId) => tagsById[tagId] ?? [])}
                onTaskOpen={onTaskOpen}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card className="flex flex-col gap-3 p-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("taskList.pagination.range", { count: rows.length, page: currentPage, total: totalFilteredCount, totalPages })}</span>
        <div className="flex gap-2">
          <Button size="sm" type="button" variant="secondary" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
            {t("taskList.pagination.previous")}
          </Button>
          <Button size="sm" type="button" variant="secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
            {t("taskList.pagination.next")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function groupRowsByProject(rows: TaskListRow[]) {
  const groups = new Map<string, { boardIds: Set<string>; projectId: string; projectName: string; rows: TaskListRow[] }>();

  rows.forEach((row) => {
    const projectId = row.project?.id ?? "unknown";
    const group = groups.get(projectId) ?? {
      boardIds: new Set<string>(),
      projectId,
      projectName: row.project?.name ?? "-",
      rows: [],
    };

    if (row.board) {
      group.boardIds.add(row.board.id);
    }

    group.rows.push(row);
    groups.set(projectId, group);
  });

  return Array.from(groups.values()).map((group) => ({
    boardCount: group.boardIds.size,
    projectId: group.projectId,
    projectName: group.projectName,
    rows: group.rows,
  }));
}

function TaskListRowItem({
  locale,
  profilesById,
  row,
  tags,
  onTaskOpen,
}: {
  locale: string;
  profilesById: Record<string, Profile>;
  row: TaskListRow;
  tags: Tag[];
  onTaskOpen: (taskId: string) => void;
}) {
  const { t } = useTranslation();
  const { task, column } = row;
  const assignee = task.assigneeId ? profilesById[task.assigneeId] : undefined;

  return (
    <button
      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 lg:grid-cols-[1.4fr_1fr_0.75fr_0.75fr_0.9fr_auto] lg:items-center"
      type="button"
      aria-label={t("taskDetails.openTask", { task: task.title })}
      onClick={() => onTaskOpen(task.id)}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{task.title}</p>
        {task.description && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{task.description}</p>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => <Badge key={tag.id} variant={tagVariant[tag.color]}>{tag.name}</Badge>)}
          </div>
        )}
      </div>

      <span className="min-w-0 text-sm font-medium text-slate-300">
        <span className="block truncate text-white">{row.board?.name ?? "-"}</span>
        <span className="mt-1 block truncate text-xs text-slate-500">{column.name}</span>
      </span>
      <Badge variant={priorityVariant[task.priority]}>{t(`taskPriority.${task.priority}`)}</Badge>
      <span className="inline-flex items-center gap-2 text-sm text-slate-400">
        <CalendarDays className="size-4" />
        {task.deadline ? formatDate(task.deadline, locale) : t("board.noDeadline")}
      </span>
      <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-400">
        <UserRound className="size-4 shrink-0" />
        <span className="truncate">{assignee?.fullName || assignee?.email || t("taskAssignee.unassigned")}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-sm text-slate-500 lg:justify-end">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-4" />
          {task.completedAt || column.final ? t("taskList.done") : t("taskList.open")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-4" />
          {task.commentIds.length}
        </span>
        <ArrowUpRight className="size-4" />
      </span>
    </button>
  );
}
