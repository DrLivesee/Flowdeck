import { Activity, AlertTriangle, CheckCircle2, ListChecks, Target } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";

import { withBoardColumns } from "@/entities/board";
import { emptyBoardDataSnapshot, emptyWorkspaceSnapshot, useBoardDataQuery, useWorkspaceQuery } from "@/entities/project";
import { useProfileQuery } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { formatCompactNumber, formatPercent, getStoredBoardId } from "@/shared/lib";
import { Card } from "@/shared/ui";

import { buildAnalyticsView } from "../model/analytics-view";
import { DistributionCard } from "./distribution-card";
import { MetricCard } from "./metric-card";
import { RecentTasksCard } from "./recent-tasks-card";

export function AnalyticsPage() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const { data: currentProfile = null, isLoading: isProfileLoading } = useProfileQuery(user?.id);
  const { data: workspaceData, isError: isWorkspaceError, isLoading: isWorkspaceLoading } = useWorkspaceQuery();
  const workspace = workspaceData ?? emptyWorkspaceSnapshot;
  const storedBoardId = getStoredBoardId(workspace.boardsById);
  const activeBoardId = storedBoardId ?? workspace.activeBoardId;
  const activeBoard = activeBoardId ? workspace.boardsById[activeBoardId] : null;
  const { data: boardData, isError: isBoardDataError, isLoading: isBoardDataLoading } = useBoardDataQuery(activeBoardId);
  const boardSnapshot = boardData ?? emptyBoardDataSnapshot;
  const columnsById = boardSnapshot.columnsById;
  const tasksById = boardSnapshot.tasksById;
  const locale = i18n.language === "en" ? "en-US" : "ru-RU";
  const activeBoardView = useMemo(
    () => withBoardColumns(activeBoard, columnsById),
    [activeBoard, columnsById],
  );
  const isLoading = isWorkspaceLoading || Boolean(activeBoard && isBoardDataLoading);
  const isError = isWorkspaceError || isBoardDataError;
  const analytics = useMemo(
    () => buildAnalyticsView({ activeBoard: activeBoardView, columnsById, tasksById }),
    [activeBoardView, columnsById, tasksById],
  );
  const metrics = [
    {
      description: t("analytics.metrics.totalDescription"),
      icon: Target,
      label: t("analytics.metrics.total"),
      value: formatCompactNumber(analytics.totalTasks, locale),
    },
    {
      description: t("analytics.metrics.completionDescription"),
      icon: CheckCircle2,
      label: t("analytics.metrics.completion"),
      value: formatPercent(analytics.completionRatio),
    },
    {
      description: t("analytics.metrics.overdueDescription"),
      icon: AlertTriangle,
      label: t("analytics.metrics.overdue"),
      value: formatCompactNumber(analytics.overdueTasks, locale),
    },
    {
      description: t("analytics.metrics.checklistDescription"),
      icon: ListChecks,
      label: t("analytics.metrics.checklist"),
      value: formatPercent(analytics.checklistRatio),
    },
    {
      description: t("analytics.metrics.updatedTodayDescription"),
      icon: Activity,
      label: t("analytics.metrics.updatedToday"),
      value: formatCompactNumber(analytics.updatedToday, locale),
    },
  ];

  if (isProfileLoading) {
    return (
      <section className="space-y-6">
        <Card className="border-dashed border-white/10 p-8 text-center">
          <p className="text-sm leading-6 text-slate-500">{t("common.loading")}</p>
        </Card>
      </section>
    );
  }

  if (currentProfile?.role !== "admin" && currentProfile?.role !== "manager") {
    return <Navigate replace to="/tasks" />;
  }

  return (
    <section className="space-y-6">
      {(isLoading || isError || !activeBoard) && (
        <Card className="border-dashed border-white/10 p-8 text-center">
          <p className="font-bold text-white">{isError ? t("common.serverError") : isLoading ? t("common.loading") : t("analytics.noActiveBoard")}</p>
        </Card>
      )}

      {!isLoading && !isError && activeBoard && (
        <>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionCard
          title={t("analytics.priority.title")}
          emptyText={t("analytics.empty.distribution")}
          items={analytics.priorityBreakdown}
          renderLabel={(item) => t(`taskPriority.${item.label}`)}
        />
        <DistributionCard
          title={t("analytics.columns.title")}
          emptyText={t("analytics.empty.distribution")}
          items={analytics.columnBreakdown}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentTasksCard locale={locale} rows={analytics.recentTasks} />
        <SummaryCard
          completedTasks={analytics.completedTasks}
          totalTasks={analytics.totalTasks}
          completionRatio={analytics.completionRatio}
        />
      </div>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  completedTasks,
  completionRatio,
  totalTasks,
}: {
  completedTasks: number;
  completionRatio: number;
  totalTasks: number;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-2xl shadow-black/20">
      <h3 className="font-bold text-white">{t("analytics.summary.title")}</h3>
      <p className="mt-3 text-5xl font-black text-white">{formatPercent(completionRatio)}</p>
      <p className="mt-2 text-sm leading-6 text-cyan-50/75">
        {t("analytics.summary.completed", { completed: completedTasks, total: totalTasks })}
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-950/50">
        <div
          className="h-full rounded-full bg-cyan-300"
          style={{ width: `${Math.round(completionRatio * 100)}%` }}
        />
      </div>
    </section>
  );
}
