import { Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/shared/lib";
import { Badge } from "@/shared/ui";

import type { AnalyticsTaskRow } from "../model/analytics-view";

type RecentTasksCardProps = {
  locale: string;
  rows: AnalyticsTaskRow[];
};

export function RecentTasksCard({ locale, rows }: RecentTasksCardProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 lg:col-span-2">
      <div className="flex items-center gap-3">
        <Clock3 className="size-5 text-cyan-200" />
        <h3 className="font-bold text-white">{t("analytics.recent.title")}</h3>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length > 0 ? (
          rows.map(({ column, task }) => (
            <article key={task.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-white">{task.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {column.name} · {formatDate(task.updatedAt, locale)}
                  </p>
                </div>
                <Badge variant="slate">{t(`taskPriority.${task.priority}`)}</Badge>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-500">{t("analytics.empty.recent")}</p>
        )}
      </div>
    </section>
  );
}
